package;

import haxe.crypto.Base64;
import haxe.io.Bytes;
import openfl.display.Bitmap;
import openfl.display.BitmapData;
import js.Browser;
import js.html.URLSearchParams;
import openfl.display.Sprite;

class Main extends Sprite {
	static inline var KEY_HEX_LENGTH:Int = 64;
	static inline var KEY_BYTE_LENGTH:Int = 32;

	static function sanitizeHexKey(raw:String):String {
		var cleaned = ~/[^a-fA-F0-9]/g.replace(raw, "").toLowerCase();
		if (cleaned.length > KEY_HEX_LENGTH) {
			cleaned = cleaned.substr(cleaned.length - KEY_HEX_LENGTH);
		}
		while (cleaned.length < KEY_HEX_LENGTH) {
			cleaned = "0" + cleaned;
		}
		return cleaned;
	}

	static function bytesToHex(bytes:Bytes):String {
		var out = new StringBuf();
		for (i in 0...bytes.length) {
			out.add(StringTools.hex(bytes.get(i), 2).toLowerCase());
		}
		return out.toString();
	}

	static function decodeBase64Url(compact:String):Null<Bytes> {
		if (compact == null || compact.length == 0) {
			return null;
		}

		var normalized = compact.split("-").join("+").split("_").join("/");
		while (normalized.length % 4 != 0) {
			normalized += "=";
		}

		try {
			return Base64.decode(normalized);
		} catch (_:Dynamic) {
			return null;
		}
	}

	static function decodeCompactKey(compact:String):Null<String> {
		if (compact == null || compact.length == 0) {
			return null;
		}

		var decoded = decodeBase64Url(compact);
		if (decoded == null || decoded.length != KEY_BYTE_LENGTH) {
			return null;
		}

		return bytesToHex(decoded);
	}

	public var zoom1xSprite:Bitmap;
	public var zoom5xSprite:Bitmap;
	public var zoom25xSprite:Bitmap;

	public function new() {
		super();
		stage.color = 0x212529;

		stage.quality = LOW;

		var search:String = Browser.window.location.search;

		var searchParams:URLSearchParams = new URLSearchParams(search);
		var graphicKey:String = [for (i in 0...KEY_HEX_LENGTH) 0].join("");
		if (searchParams.has("key")) {
			graphicKey = sanitizeHexKey(searchParams.get("key"));
		} else if (searchParams.has("c")) {
			var decoded = decodeCompactKey(searchParams.get("c"));
			if (decoded != null) {
				graphicKey = decoded;
			}
		}
		if (searchParams.has("palette"))
			Globals.setPalette(searchParams.get("palette"));
		

		Globals.parseGraphicData(graphicKey);

		var bitmapData:BitmapData = Globals.buildImage();

		zoom1xSprite = new Bitmap(bitmapData);
		zoom1xSprite.smoothing = false;

		zoom5xSprite = new Bitmap(bitmapData);
		zoom5xSprite.scaleX = 5;
		zoom5xSprite.scaleY = 5;
		zoom5xSprite.smoothing = false;

		zoom25xSprite = new Bitmap(bitmapData);
		zoom25xSprite.scaleX = 25;
		zoom25xSprite.scaleY = 25;
		zoom25xSprite.smoothing = false;

		zoom25xSprite.x = 22;
		zoom25xSprite.y = 22;

		zoom1xSprite.x = zoom25xSprite.x + zoom25xSprite.width + 23;
		zoom1xSprite.y = zoom25xSprite.y - 1;

		zoom5xSprite.x = zoom1xSprite.x;
		zoom5xSprite.y = zoom1xSprite.y + zoom1xSprite.height + 21;

		addChild(zoom25xSprite);
		addChild(zoom5xSprite);
		addChild(zoom1xSprite);

		var scaledSize:Int = Std.int((16 * 25) + 4);
		var lines:BitmapData = new BitmapData(scaledSize, scaledSize, true, 0x00000000);
		var lineColor:Int = 0xff495057;

		// use openfl.display.bitmapData.fillRect and openfl.geom.Rectangle to draw a 16x16 pixel grid with 2-pixel wide lines
		for (y in 0...16) {
			var posY:Int = y * 25;
			lines.fillRect(new openfl.geom.Rectangle(0, posY, scaledSize, 2), lineColor);
			lines.fillRect(new openfl.geom.Rectangle(posY, 0, 2, scaledSize), lineColor);
		}

		lines.fillRect(new openfl.geom.Rectangle(0, 0, scaledSize, 3), lineColor);
		lines.fillRect(new openfl.geom.Rectangle(0, scaledSize - 3, scaledSize, 3), lineColor);
		lines.fillRect(new openfl.geom.Rectangle(0, 0, 3, scaledSize), lineColor);
		lines.fillRect(new openfl.geom.Rectangle(scaledSize - 3, 0, 3, scaledSize), lineColor);

		var linesSprite:Bitmap = new Bitmap(lines);
		linesSprite.x = zoom25xSprite.x - 2;
		linesSprite.y = zoom25xSprite.y - 2;

		addChild(linesSprite);

		var border1x:BitmapData = new BitmapData(Std.int(zoom1xSprite.width) + 2, Std.int(zoom1xSprite.height) + 2, true, 0x00000000);
		border1x.fillRect(new openfl.geom.Rectangle(0, 0, border1x.width, 1), lineColor);
		border1x.fillRect(new openfl.geom.Rectangle(0, 0, 1, border1x.height), lineColor);
		border1x.fillRect(new openfl.geom.Rectangle(0, border1x.height - 1, border1x.width, 1), lineColor);
		border1x.fillRect(new openfl.geom.Rectangle(border1x.width - 1, 0, 1, border1x.height), lineColor);

		var border1xSprite:Bitmap = new Bitmap(border1x);
		border1xSprite.x = zoom1xSprite.x - 1;
		border1xSprite.y = zoom1xSprite.y - 1;
		addChild(border1xSprite);

		var border5x:BitmapData = new BitmapData(Std.int(zoom5xSprite.width) + 2, Std.int(zoom5xSprite.height) + 2, true, 0x00000000);
		border5x.fillRect(new openfl.geom.Rectangle(0, 0, border5x.width, 1), lineColor);
		border5x.fillRect(new openfl.geom.Rectangle(0, 0, 1, border5x.height), lineColor);
		border5x.fillRect(new openfl.geom.Rectangle(0, border5x.height - 1, border5x.width, 1), lineColor);
		border5x.fillRect(new openfl.geom.Rectangle(border5x.width - 1, 0, 1, border5x.height), lineColor);

		var border5xSprite:Bitmap = new Bitmap(border5x);
		border5xSprite.x = zoom5xSprite.x - 1;
		border5xSprite.y = zoom5xSprite.y - 1;
		addChild(border5xSprite);
	}
}
