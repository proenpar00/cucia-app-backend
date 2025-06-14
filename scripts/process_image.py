import sys
import json
import torch
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

# Clases según Bethesda
CLASSES = ["ASC-H", "ASC-US", "HSIL", "LSIL", "NILM", "SCC"]
DEVICE = 'cuda' if torch.cuda.is_available() else 'cpu'

def load_model(model_type):
    weights_path = Path("weights") / f"{model_type}.pt"
    if not weights_path.exists():
        raise FileNotFoundError(f"No se encontró el archivo de pesos en {weights_path}")

    if model_type == 'yolov5':
        model = torch.hub.load('ultralytics/yolov5', 'custom', path=str(weights_path))
    elif model_type in ['yolov8', 'yolov12']:
        from ultralytics import YOLO
        model = YOLO(str(weights_path))
    elif model_type == 'fasterrcnn':
        from torchvision.models.detection import fasterrcnn_resnet50_fpn
        model = fasterrcnn_resnet50_fpn(pretrained=False)
        model.load_state_dict(torch.load(weights_path, map_location=DEVICE))
        model.eval()
    elif model_type == 'retinanet':
        from torchvision.models.detection import retinanet_resnet50_fpn
        model = retinanet_resnet50_fpn(pretrained=False)
        model.load_state_dict(torch.load(weights_path, map_location=DEVICE))
        model.eval()
    else:
        raise ValueError(f"Modelo '{model_type}' no soportado")

    model.to(DEVICE)
    return model

def run_inference_and_annotate(model_type, image_path):
    model = load_model(model_type)

    image = Image.open(image_path).convert("RGB")
    draw = ImageDraw.Draw(image)

    font = ImageFont.load_default()

    detections = []

    if model_type in ['yolov5']:
        results = model(image_path, size=1024)
        for *box, conf, cls in results.xyxy[0]:
            x1, y1, x2, y2 = map(int, box)
            cls_id = int(cls)
            conf_score = round(conf.item(), 2)
            detections.append({"class": CLASSES[cls_id], "confidence": conf_score})

            # Dibujar rectángulo y texto
            draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
            draw.text((x1, y1 - 10), f"{CLASSES[cls_id]} {conf_score}", fill="black", font=font)

    elif model_type in ['yolov8', 'yolov12']:
        results = model.predict(source=image_path, imgsz=1024)
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0].item())
                conf_score = round(float(box.conf[0].item()), 2)
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detections.append({"class": CLASSES[cls_id], "confidence": conf_score})

                draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
                draw.text((x1, y1 - 10), f"{CLASSES[cls_id]} {conf_score}", fill="black", font=font)

    else:  # Faster R-CNN y RetinaNet
        from torchvision import transforms

        transform = transforms.Compose([transforms.ToTensor()])
        image_t = transform(image).to(DEVICE)

        with torch.no_grad():
            outputs = model([image_t])

        output = outputs[0]
        for idx in range(len(output['boxes'])):
            score = output['scores'][idx].item()
            if score < 0.3:
                continue
            cls_idx = output['labels'][idx].item()
            if model_type == 'retinanet':
                cls_idx -= 1  # Ajuste para retinanet
            detections.append({
                "class": CLASSES[cls_idx],
                "confidence": round(score, 2)
            })

            box = output['boxes'][idx].tolist()
            x1, y1, x2, y2 = map(int, box)
            draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
            draw.text((x1, y1 - 10), f"{CLASSES[cls_idx]} {round(score, 2)}", fill="black", font=font)

    # Guardar imagen anotada con sufijo _output antes de la extensión
    output_path = image_path.parent / f"{image_path.stem}_output{image_path.suffix}"
    image.save(output_path)

    return detections, output_path

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(json.dumps({"error": "Uso: python process_image.py <image_path> <model_type>"}))
        sys.exit(1)

    image_path = Path(sys.argv[1])
    model_type = sys.argv[2].lower()

    try:
        detections, annotated_path = run_inference_and_annotate(model_type, image_path)
        print(json.dumps({"detections": detections}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
