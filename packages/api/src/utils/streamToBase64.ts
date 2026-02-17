export default function streamToBase64(stream: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on("data", chunk => chunks.push(Buffer.from(chunk)));
    stream.on("end", () =>
      resolve(Buffer.concat(chunks).toString("base64"))
    );
    stream.on("error", reject);
  });
}