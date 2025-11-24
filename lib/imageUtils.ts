export const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const image = new Image()
        image.addEventListener('load', () => resolve(image))
        image.addEventListener('error', (error) => reject(error))
        image.setAttribute('crossOrigin', 'anonymous') // needed to avoid cross-origin issues on CodeSandbox
        image.src = url
    })

export function getRadianAngle(degreeValue: number) {
    return (degreeValue * Math.PI) / 180
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
export function rotateSize(width: number, height: number, rotation: number) {
    const rotRad = getRadianAngle(rotation)

    return {
        width:
            Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
        height:
            Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    }
}

/**
 * This function was adapted from the one in the Readme of https://github.com/DominicTobias/react-image-crop
 */
export default async function getCroppedImg(
    imageSrc: string,
    pixelCrop: { x: number; y: number; width: number; height: number } | null,
    rotation = 0,
    flip = { horizontal: false, vertical: false },
    forceAspectRatio?: number // Optional: if provided, and pixelCrop is null, we auto-crop to this ratio
): Promise<Blob | null> {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
        return null
    }

    const rotRad = getRadianAngle(rotation)

    // calculate bounding box of the rotated image
    const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
    )

    // set canvas size to match the bounding box
    canvas.width = bBoxWidth
    canvas.height = bBoxHeight

    // translate canvas context to a central location to allow rotating and flipping around the center
    ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
    ctx.rotate(rotRad)
    ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
    ctx.translate(-image.width / 2, -image.height / 2)

    // draw image
    ctx.drawImage(image, 0, 0)

    // croppedAreaPixels values are bounding box relative
    // extract the cropped image using these values
    const data = ctx.getImageData(
        pixelCrop ? pixelCrop.x : 0,
        pixelCrop ? pixelCrop.y : 0,
        pixelCrop ? pixelCrop.width : bBoxWidth,
        pixelCrop ? pixelCrop.height : bBoxHeight
    )

    // If we are doing a manual crop (pixelCrop provided)
    if (pixelCrop) {
        canvas.width = pixelCrop.width
        canvas.height = pixelCrop.height
        ctx.putImageData(data, 0, 0)
    } else if (forceAspectRatio) {
        // Auto-crop logic for "System Crop"
        // If the image is too tall (aspect ratio < forceAspectRatio), crop it from the center
        const currentRatio = bBoxWidth / bBoxHeight

        // Only crop if it's taller than the target ratio (e.g. 0.5 < 0.8)
        // If forceAspectRatio is 0.8 (4:5), and image is 0.5 (1:2), we need to crop height.
        // Wait, if we want to enforce "max tallness", we only care if currentRatio < forceAspectRatio.

        if (currentRatio < forceAspectRatio) {
            const newHeight = bBoxWidth / forceAspectRatio;
            const startY = (bBoxHeight - newHeight) / 2;

            // We need to redraw/crop from the canvas we just drew
            const croppedData = ctx.getImageData(0, startY, bBoxWidth, newHeight);
            canvas.width = bBoxWidth;
            canvas.height = newHeight;
            ctx.putImageData(croppedData, 0, 0);
        }
    }

    return new Promise((resolve, reject) => {
        canvas.toBlob((file) => {
            if (file) resolve(file)
            else reject(new Error('Canvas is empty'))
        }, 'image/jpeg', 0.95) // Use JPEG for better compression usually, or PNG if transparency needed.
    })
}

export async function autoCropImageIfNeeded(file: File, maxAspectRatio = 0.8): Promise<File> {
    if (!file.type.startsWith('image/')) return file;

    return new Promise((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = async () => {
            const ratio = img.width / img.height;
            if (ratio < maxAspectRatio) {
                // Needs cropping
                try {
                    // Calculate center crop
                    const newHeight = img.width / maxAspectRatio;
                    const y = (img.height - newHeight) / 2;

                    const blob = await getCroppedImg(
                        url,
                        { x: 0, y, width: img.width, height: newHeight },
                        0
                    );
                    if (blob) {
                        resolve(new File([blob], file.name, { type: file.type }));
                    } else {
                        resolve(file);
                    }
                } catch (e) {
                    console.error("Auto-crop failed", e);
                    resolve(file);
                }
            } else {
                resolve(file);
            }
            URL.revokeObjectURL(url);
        };
        img.onerror = () => {
            URL.revokeObjectURL(url);
            resolve(file);
        }
        img.src = url;
    });
}
