export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image();
        const timeout = setTimeout(() => {
            reject(new Error("Image load timed out"));
        }, 15000);

        image.addEventListener("load", () => {
            clearTimeout(timeout);
            resolve(image);
        });
        image.addEventListener("error", (error) => {
            clearTimeout(timeout);
            console.error("Image load error:", error);
            reject(error);
        });
        if (!url.startsWith('data:')) {
            image.setAttribute("crossOrigin", "anonymous");
        }
        image.src = url;
    });

export async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number },
    flip = { horizontal: false, vertical: false }
): Promise<Blob | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return null;
    }

    // set canvas size to match the bounding box
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // translate canvas context to a point where the crop starts
    ctx.translate(-pixelCrop.x, -pixelCrop.y);

    // flip the image
    if (flip.horizontal || flip.vertical) {
        ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
    }

    // draw the image
    ctx.drawImage(image, 0, 0);

    // As a blob
    return new Promise((resolve) => {
        canvas.toBlob((file) => {
            resolve(file);
        }, "image/jpeg", 0.7); // 70% quality to save space
    });
}

export async function getCroppedImgBase64(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string | null> {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    // Set a reasonable size for profile photos (e.g., 300x300) to keep Firestore docs small
    canvas.width = 300;
    canvas.height = 300;

    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        300,
        300
    );

    return canvas.toDataURL("image/jpeg", 0.6); // 60% quality for optimal Firestore storage
}
