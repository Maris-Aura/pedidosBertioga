export async function fileToDataUrl(
  file: File,
  options?: { maxSize?: number; quality?: number },
) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Escolha um arquivo de imagem.");
  }

  const maxSize = options?.maxSize ?? 900;
  const quality = options?.quality ?? 0.82;
  const source = await readImage(file);
  const { width, height } = fitSize(source.width, source.height, maxSize);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Não foi possível converter a foto.");
  context.drawImage(source, 0, 0, width, height);

  const keepPng = file.type === "image/png" || file.type === "image/svg+xml";
  return canvas.toDataURL(keepPng ? "image/png" : "image/jpeg", quality);
}

function fitSize(width: number, height: number, maxSize: number) {
  const longest = Math.max(width, height);
  if (longest <= maxSize) return { width, height };
  const scale = maxSize / longest;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

function readImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível ler esta foto."));
    };
    image.src = url;
  });
}
