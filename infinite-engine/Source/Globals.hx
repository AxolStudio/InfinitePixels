package;

import openfl.display.BitmapData;
import haxe.io.Bytes;

typedef Palette = Array<Int>;

class Globals
{
	public static var BASE_PALETTE:Palette = [0xffe4dbba, 0xffa4929a, 0xff4f3a54, 0xff260d1c];

	public static var palette:Palette = BASE_PALETTE;

	public static var GraphicData:Array<Int> = [for (a in 0...256) 0];

	public static function parseGraphicData(GraphicKey:String):Void
	{
		var arr:Array<String> = GraphicKey.split("");
		var tempData:Array<Array<Int>> = [for (a in 0...2) []];

		for (r in 0...32)
		{
			var row:Array<String> = arr.splice(0, 4);

			var rowStr:String = row.join("");
			var bytes:Bytes = Bytes.ofHex(rowStr);

			for (b in 0...bytes.length)
			{
				var num:Int = bytes.get(b);
				for (i in 0...8)
				{
					tempData[Std.int(r / 16)].push((num >> i) & 1);
				}
			}
		}

		for (i in 0...256)
		{
			GraphicData[i] = tempData[0][i] + (tempData[1][i] * 2);
		}
	}

	public static function buildImage():BitmapData
	{
		var image:BitmapData = new BitmapData(16, 16, false, palette[0]);

		for (i in 0...256)
		{
			var x:Int = i % 16;
			var y:Int = Std.int(i / 16);

			image.setPixel(x, y, palette[GraphicData[i]]);
		}

		return image;
	}

    public static function setPalette(Input:String):Void
    {
        var inputArr:Array<String> = Input.split(",");
        if (inputArr.length == 4)
        {
            var tempPalette:Palette = [for (i in 0...4) 0];
            for (i in 0...4)
            {
                tempPalette[i] = Std.parseInt("0x"+inputArr[i]);
            }
            palette = tempPalette;
        }
    }
}
