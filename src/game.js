// game.js

// Tree
function Tree(bounds)
{
  this._Sprite(bounds);
  this.zorder = -1;
  this.height = 0;
  this.cells = [{x:0, y:0, stage:-1}];
  this.growq = [];
}
  
define(Tree, Sprite, 'Sprite', {
  addGrow: function () {
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      switch (cell.stage) {
      case 0:
	cell.stage++;
	break;
      }
    }
    if ((this.height % 2) != 0) {
      this.growq.push({ x:0, y:this.height, stage:2 });
      this.growq.push({ x:-1, y:this.height, stage:2 });
      this.growq.push({ x:+1, y:this.height, stage:2 });
    } else {
      this.growq.push({ x:0, y:this.height, stage:0 });
    }
    this.height++;
  },

  getRect: function (x, y) {
    return new Rect(this.bounds.x+this.bounds.width*x,
		    this.bounds.y-this.bounds.height*y,
		    this.bounds.width, this.bounds.height);
  },

  getCellRects: function (hitbox) {
    var rects = [];
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      if (cell.stage < 0) continue;
      var rect = this.getRect(cell.x, cell.y);
      if (rect.overlap(hitbox)) {
	rects.push(rect);
      }
    }
    return rects;
  },

  growCells: function () {
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      switch (cell.stage) {
      case 2:
	if (Math.abs(cell.x) < 3) {
	  if (cell.x != 0) {
	    var vx = (cell.x < 0)? -1 : +1;
	    this.growq.push({ x:cell.x+vx, y:cell.y, stage:2 });
	  }
	  cell.stage++;
	}
	break;
      case 3:
	break;
      }
    }
  },
  
  update: function () {
    if ((this.getTime() % 10) == 0) {
      this.growCells();
    }
    for (var i = this.growq.length-1; 0 <= i; i--) {
      var f = (function (obj) { return true; });
      var cell = this.growq[i];
      var rect = this.getRect(cell.x, cell.y);
      var objs = this.scene.findObjects(rect, f);
      if (objs.length != 0) {
	for (var j = 0; j < objs.length; j++) {
	  var obj = objs[i];
	  if (obj instanceof Obstacle ||
	      obj instanceof Hazard ||
	      obj instanceof Collectible) {
	    obj.die();
	  }
	}
      } else {
	this.cells.push(cell);
	this.growq.splice(i, 1);
      }
    }
  },
  
  render: function (ctx, bx, by) {
    var tiles = this.scene.app.tiles;
    var tw = 16;
    var th = 16;
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      var bounds = this.getRect(cell.x, cell.y);
      var tileno = 0;
      switch (cell.stage) {
      case -1:
	tileno = 0;
	break;
      case 0:
	tileno = 1;
	break;
      case 1:
	tileno = 8;
	break;
      case 2:
	tileno = (cell.x == 0)? 2 : 4;
	break;
      case 3:
	tileno = (cell.x == 0)? 2 : 3;
	break;
      }
      if (cell.x < 0) {
	drawImageFlipped(ctx, tiles,
			 tileno*tw, 0, tw, th,
			 bx+bounds.x, by+bounds.y,
			 bounds.width, bounds.height);
      } else {
	ctx.drawImage(tiles,
		      tileno*tw, 0, tw, th,
		      bx+bounds.x, by+bounds.y,
		      bounds.width, bounds.height);
      }
    }
  },
});

// Obstacle
function Obstacle(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
}
  
define(Obstacle, Actor, 'Actor', {
});

// Hazard
function Hazard(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
}
  
define(Hazard, Actor, 'Actor', {
});

// Collectible
function Collectible(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
}
  
define(Collectible, Actor, 'Actor', {
});


// Brick
function Brick(bounds)
{
  this._Obstacle(bounds, bounds, 2);
}
  
define(Brick, Obstacle, 'Obstacle', {
});

// Bomb
function Bomb(bounds)
{
  this._Hazard(bounds, bounds, 5);
}
  
define(Bomb, Hazard, 'Hazard', {
});

// Balloon
function Balloon(bounds)
{
  this._Collectible(bounds, bounds, 3); // or 4
}
  
define(Balloon, Collectible, 'Collectible', {
  update: function () {
    this.phase = blink(this.getTime(), 20)? 0 : 1;
    this._Collectible_update();
  },
});


// Actor2
function Actor2(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
  this.velocity = new Vec2();
}

define(Actor2, Actor, 'Actor', {
  getMoveFor: function (v, rect) {
    var hitbox = this.hitbox.copy();
    var d0 = hitbox.contact(v, rect);
    hitbox.x += d0.x;
    hitbox.y += d0.y;
    v = v.sub(d0);
    var d1 = hitbox.contact(new Vec2(v.x,0), rect);
    hitbox.x += d1.x;
    hitbox.y += d1.y;
    v = v.sub(d1);
    var d2 = hitbox.contact(new Vec2(0,v.y), rect);
    return new Vec2(d0.x+d1.x+d2.x,
		    d0.y+d1.y+d2.y);
  },
  
  getMove: function (v) {
    if (this.hitbox === null) return v;
    var box = this.hitbox.union(this.hitbox.movev(v));
    var f = (function (obj) { return (obj instanceof Obstacle); });
    var objs = this.scene.findObjects(box, f);
    for (var i = 0; i < objs.length; i++) {
      var obj = objs[i];
      v = this.getMoveFor(v, obj.hitbox);
    }
    var rects = this.scene.tree.getCellRects(box);
    for (var i = 0; i < rects.length; i++) {
      v = this.getMoveFor(v, rects[i]);
    }
    var rect = this.hitbox.movev(v).clamp(this.scene.world);
    return rect.diff(this.hitbox);
  },
  
  update: function () {
    this._Actor_update();
    if (this.scene.isActive()) {
      this.velocity = this.getMove(this.velocity);
      this.flipped = (this.velocity.x < 0);
      this.move(this.velocity.x, this.velocity.y);
    }
  },
});


// Pigeon
function Pigeon(bounds)
{
  this._Actor2(bounds, bounds, 0);
  this.speed = 4;
  this.jumpacc = -4;
  this.gravity = 1;
  this.maxspeed = 4;
  this.flying = false;
  this.health = 1;
  this.invuln = 0;
  this.zorder = 1;
}

define(Pigeon, Actor2, 'Actor2', {
  update: function () {
    if (this.scene.isActive()) {
      if (0 < this.health) {
	var v = this.getMove(this.velocity);
	if (v.x != this.velocity.x) {
	  this.speed = -this.speed;
	}
	this.tileno = (v.y != 0)? 1 : 0;
	if (this.flying) {
	  this.velocity.y = this.jumpacc;
	}
	this.velocity.x = this.speed;
	if (0 < this.invuln) {
	  this.invuln--;
	  this.visible = blink(this.getTime(), 10);
	} else {
	  this.visible = true;
	}
      }
      this.velocity.y += this.gravity;
      this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
    }
    this.phase = blink(this.getTime(), 10)? 0 : 1;
    this._Actor2_update();
  },

  collide: function (obj) {
    if (this.scene.isActive()) {
      if (obj instanceof Collectible) {
	obj.die();
      } else if (obj instanceof Hazard) {
	if (this.invuln == 0) {
	  this.health--;
	  if (this.health == 0) {
	    this.visible = true;
	    this.tileno = 6;
	    this.hitbox = null;
	    this.velocity = new Vec2();
	  } else {
	    this.invuln = 50;
	  }
	}
      }
    }
  },
  
});


//  Game
// 
function Game(app)
{
  this._GameScene(app);
  this.tilesize = 16;
  this.world = new Rect(0, 0, this.frame.width, this.frame.height*16);
  this.window = this.frame.copy();
}

define(Game, GameScene, 'GameScene', {
  init: function () {
    this._GameScene_init();

    var app = this.app;
    var tilesize = this.tilesize;
    var rect = MakeRect(this.world.anchor(0,-1)).expand(tilesize, tilesize, 0, -1);
    this.player = new Pigeon(rect.copy());
    this.addObject(this.player);
    this.tree = new Tree(rect.copy());
    this.addObject(this.tree);
    
    for (var i = 0; i < 20; i++) {
      var x = rnd(Math.floor(this.world.width/tilesize));
      var y = rnd(Math.floor(this.world.height/tilesize));
      var rect = new Rect(x*tilesize, y*tilesize, tilesize, tilesize);
      var obj = new Brick(rect);
      this.addObject(obj);
    }
    
    for (var i = 0; i < 20; i++) {
      var x = rnd(Math.floor(this.world.width/tilesize));
      var y = rnd(Math.floor(this.world.height/tilesize));
      var rect = new Rect(x*tilesize, y*tilesize, tilesize, tilesize);
      var obj = new Balloon(rect);
      this.addObject(obj);
    }

    for (var i = 0; i < 20; i++) {
      var x = rnd(Math.floor(this.world.width/tilesize));
      var y = rnd(Math.floor(this.world.height/tilesize));
      var rect = new Rect(x*tilesize, y*tilesize, tilesize, tilesize);
      var obj = new Bomb(rect);
      this.addObject(obj);
    }

    var text = new TextBox(this.frame, app.font);
    this.textHealth = text.addSegment(new Vec2(4,4), '\x7f', app.colorfont);
    this.addObject(text);
    
    rect = MakeRect(this.frame.anchor(0,1)).expand(100, 40, 0, 1).move(0, 20);
    this.textbox = new TextBoxTT(rect, app.font);
    this.textbox.background = 'rgba(0,0,0,0.5)'
    this.textbox.padding = 8;
    this.textbox.linespace = 4;
    this.textbox.addDisplay('FLY BIRD..UP\n', 2);
    this.textbox.addDisplay('GROW...SPACE\n', 2);
    this.textbox.addDisplay('REACH TOP!!', 2);
    this.textbox.duration = app.framerate*4;
    this.addObject(this.textbox);
  },

  setCenter: function (rect) {
    if (this.window.width < rect.width) {
      this.window.x = (rect.width-this.window.width)/2;
    } else if (rect.x < this.window.x) {
      this.window.x = rect.x;
    } else if (this.window.x+this.window.width < rect.x+rect.width) {
      this.window.x = rect.x+rect.width - this.window.width;
    }
    if (this.window.height < rect.height) {
      this.window.y = (rect.height-this.window.height)/2;
    } else if (rect.y < this.window.y) {
      this.window.y = rect.y;
    } else if (this.window.y+this.window.height < rect.y+rect.height) {
      this.window.y = rect.y+rect.height - this.window.height;
    }
    this.window.x = clamp(0, this.window.x, this.world.width-this.window.width);
    this.window.y = clamp(0, this.window.y, this.world.height-this.window.height);
  },

  render: function (ctx, bx, by) {
    // Draw the background.
    var bkgnd1 = this.app.images.bkgnd1;
    var by1 = Math.floor(this.window.y*bkgnd1.height/this.world.height);
    ctx.drawImage(this.app.images.bkgnd1,
		  0, by1, this.window.width, this.window.height,
		  bx, by, this.frame.width, this.frame.height);
    var by2 = 1000-Math.floor(this.window.y/2);
    ctx.drawImage(this.app.images.bkgnd2,
		  bx, by2, this.frame.width, this.frame.height);
    var bkgnd3 = this.app.images.bkgnd3;
    var by3 = this.world.height-bkgnd3.height-this.window.y;
    ctx.drawImage(bkgnd3, bx, by3);
    
    // Draw the sprites.
    for (var i = 0; i < this.sprites.length; i++) {
      var obj = this.sprites[i];
      if (obj.scene !== this) continue;
      if (!obj.visible) continue
      if (obj.bounds === null) {
	obj.render(ctx, bx, by);
      } else {
	obj.render(ctx, bx-this.window.x, by-this.window.y);
      }
    }
  },

  update: function () {
    this._GameScene_update(this);
    this.setCenter(this.player.bounds.inflate(0, 60));
    this.textHealth.text = '';
    for (var i = 0; i < this.player.health; i++) {
      this.textHealth.text += '\x7f';
    }
  },

  keydown: function (key) {
    this._GameScene_keydown(key);
    if (this.textbox.visible) {
      this.textbox.ff();
      this.textbox.visible = false;
    }
  },

  isActive: function () {
    return (!this.textbox.visible);
  },

  set_dir: function (vx, vy) {
    this._GameScene_set_dir(vx, vy);
    this.player.flying = (vy < 0);
  },

  set_action: function (action) {
    this._GameScene_set_action(action);
    if (action) {
      this.tree.addGrow();
    }
  },

});
