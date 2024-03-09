package;

import flixel.FlxG;
import flixel.util.FlxColor;
import flixel.FlxSprite;
import openfl.display.BitmapData;
import flixel.FlxState;

class PlayState extends FlxState
{
	public var bitmapData:BitmapData;
	public var bigSprite:FlxSprite;
	public var littleSprite:FlxSprite;
	public var medSprite:FlxSprite;
	
	override public function create()
	{
		bgColor = FlxColor.TRANSPARENT;
		FlxG.mouse.useSystemCursor = true;

		bitmapData = Globals.buildImage();

		bigSprite = new FlxSprite(10, 10, bitmapData);
		bigSprite.scale.set(20, 20);
		bigSprite.updateHitbox();
		add(bigSprite);

		medSprite = new FlxSprite(bigSprite.x + bigSprite.width + 10, 10, bitmapData);
		medSprite.scale.set(5, 5);
		medSprite.updateHitbox();
		add(medSprite);

		littleSprite = new FlxSprite(medSprite.x, medSprite.y + medSprite.height + 10, bitmapData);

		add(littleSprite);
		

		super.create();
	}

	override public function update(elapsed:Float)
	{
		super.update(elapsed);
	}
}
