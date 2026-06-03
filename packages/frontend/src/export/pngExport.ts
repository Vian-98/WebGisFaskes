/**
 * PNG Export Module
 * Uses html2canvas to capture the map view as a PNG image.
 */
import domtoimage from "dom-to-image-more";

export async function exportMapAsPNG(mapElement: HTMLElement, filename?: string) {
  const dateStr = new Date().toISOString().split("T")[0];
  const finalFilename = filename ?? `peta_faskes_${dateStr}.png`;

  try {
    const dataUrl = await domtoimage.toPng(mapElement, {
      width: mapElement.clientWidth * 2,
      height: mapElement.clientHeight * 2,
      style: {
        transform: "scale(2)",
        transformOrigin: "top left",
      },
      cacheBust: true,
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = finalFilename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error("Failed to export map", err);
    alert("Gagal mengekspor peta. Coba ulangi kembali.");
  }
}
