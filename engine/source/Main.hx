package;

import js.Browser;
import js.html.Window;
import js.html.URLSearchParams;
import flixel.FlxGame;
import openfl.display.Sprite;

class Main extends Sprite
{
	public function new()
	{
		super();

		var search:String = Browser.window.location.search;
		trace(search);
		var searchParams:URLSearchParams = new URLSearchParams(search);
		trace(searchParams.get("test"));

		addChild(new FlxGame(0, 0, PlayState));
	}
}
