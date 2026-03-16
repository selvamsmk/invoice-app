import { Font } from "@react-pdf/renderer";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

export function registerFonts() {
	const fontsDir =
		process.env.FONTS_DIR || path.resolve(process.cwd(), "assets/fonts"); // fallback for dev

	if (!fs.existsSync(fontsDir)) {
		console.warn("⚠️ Fonts dir not found:", fontsDir);
		return;
	}

	const fonts = [
		{ file: "OpenSans.ttf", weight: 400 },
		{ file: "OpenSans-Medium.ttf", weight: 500 },
		{ file: "OpenSans-SemiBold.ttf", weight: 600 },
		{ file: "OpenSans-Bold.ttf", weight: 700 },
		{ file: "OpenSans-ExtraBold.ttf", weight: 800 },
	];

	Font.register({
		family: "OpenSans",
		fonts: fonts.map((f) => ({
			src: pathToFileURL(path.join(fontsDir, f.file)).href,
			fontWeight: f.weight,
		})),
	});

	console.log("✅ OpenSans fonts registered from", fontsDir);
}
