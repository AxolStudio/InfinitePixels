package;

import openfl.display.BitmapData;
import haxe.io.Bytes;

typedef Palette = Array<Int>;

class Globals
{
	public static var BASE_PALETTE:Palette = [0xffe4dbba, 0xffa4929a, 0xff4f3a54, 0xff260d1c];

	public static var palette:Palette = [BASE_PALETTE[0], BASE_PALETTE[3]];

	public static var GraphicData:Array<Int> = [for (a in 0...256) 0];

	public static function parseGraphicData(GraphicKey:String):Void
	{
		var cleaned = ~/[^a-fA-F0-9]/g.replace(GraphicKey, "").toLowerCase();
		if (cleaned.length > 64)
		{
			cleaned = cleaned.substr(cleaned.length - 64);
		}
		while (cleaned.length < 64)
		{
			cleaned = "0" + cleaned;
		}

		var bytes:Bytes = Bytes.ofHex(cleaned);
		var index:Int = 0;
		for (b in 0...bytes.length)
		{
			var num:Int = bytes.get(b);
			for (i in 0...8)
			{
				if (index < 256)
				{
					GraphicData[index++] = (num >> i) & 1;
				}
			}
		}
	}

	public static function buildImage():BitmapData
	{
		var image:BitmapData = new BitmapData(16, 16, false, palette[0]);

		for (i in 0...256)
		{
			var x:Int = i % 16;
			var y:Int = Std.int(i / 16);

			image.setPixel(x, y, GraphicData[i] == 0 ? palette[0] : palette[1]);
		}

		return image;
	}

    public static function setPalette(Input:String):Void
    {
        var inputArr:Array<String> = Input.split(",");
		if (inputArr.length == 2)
		{
			var tempPalette:Palette = [for (i in 0...2) 0];
			for (i in 0...2)
			{
				tempPalette[i] = Std.parseInt("0x"+inputArr[i]);
			}
			palette = tempPalette;
		}
		else if (inputArr.length == 4)
        {
			var fourPalette:Palette = [for (i in 0...4) 0];
			for (i in 0...4)
            {
				fourPalette[i] = Std.parseInt("0x"+inputArr[i]);
            }
			palette = [fourPalette[0], fourPalette[3]];
        }
    }
}
