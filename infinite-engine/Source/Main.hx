package;

import openfl.display.Bitmap;
import openfl.display.BitmapData;
import js.Browser;
import js.html.URLSearchParams;
import openfl.display.Sprite;

class Main extends Sprite {
	public var zoom1xSprite:Bitmap;
	public var zoom5xSprite:Bitmap;
	public var zoom25xSprite:Bitmap;

	public function new() {
		super();
		stage.color = 0x33333333;

		stage.quality = LOW;

		var search:String = Browser.window.location.search;

		var searchParams:URLSearchParams = new URLSearchParams(search);
		var graphicKey:String = [for (i in 0...128) 0].join("");
		if (searchParams.has("key"))
			graphicKey = searchParams.get("key");
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
		var lineColor:Int = 0xff7f7f7f;

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
