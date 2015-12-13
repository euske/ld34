// game.js

// Tree
function Tree(bounds)
{
  this._Sprite(bounds);
  this.zorder = -1;
  this.height = 0;
  this.cells = [];
  this.growq = [];
}
  
define(Tree, Sprite, 'Sprite', {
  getRect: function (x, y) {
    return new Rect(this.bounds.x+this.bounds.width*x,
		    this.bounds.y-this.bounds.height*y,
		    this.bounds.width, this.bounds.height);
  },

  getCellRects: function (hitbox) {
    var rects = [];
    for (var i = 0; i < this.cells.length; i++) {
      var cell = this.cells[i];
      if (cell.leaf) continue;
      var rect = this.getRect(cell.x, cell.y);
      if (rect.overlap(hitbox)) {
	rects.push(rect);
      }
    }
    return rects;
  },
  
  update: function () {
    for (var i = this.growq.length-1; 0 <= i; i--) {
      var f = (function (obj) { return true; });
      var cell = this.growq[i];
      var rect = this.getRect(cell.x, cell.y);
      var objs = this.scene.findObjects(rect, f);
      if (objs.length != 0) {
	// crush objects when growing.
	for (var j = 0; j < objs.length; j++) {
	  var obj = objs[i];
	  if (obj instanceof Obstacle ||
	      obj instanceof Hazard ||
	      obj instanceof Collectible ||
	      obj instanceof Vulture) {
	    playSound(this.scene.app.audios.destroy);
	    obj.die();
	  }
	}
      } else {
	// spawn a tree cell.
	this.cells.push(cell);
	this.growq.splice(i, 1);
      }
    }
  },
  
  growCells: function () {
    for (var i = this.cells.length-1; 0 <= i; i--) {
      var cell = this.cells[i];
      var grow = false;
      cell.stage++;
      switch (cell.stage) {
      case 1:
	grow = true;
	break;
      case 2:
	grow = true;
	if ((cell.y % 2) != 0 && cell.x == 0) {
	  this.growq.push({ x:cell.x-1, y:cell.y, stage:cell.stage, leaf:true });
	  this.growq.push({ x:cell.x+1, y:cell.y, stage:cell.stage, leaf:true });
	}
	break;
      case 3:
      case 5:
	grow = true;
	if (cell.x != 0) {
	  var vx = (cell.x < 0)? -1 : +1;
	  this.growq.push({ x:cell.x+vx, y:cell.y, stage:cell.stage, leaf:true });
	}
	break;
      case 10:
	// decay?
	//if (cell.x != 0) {
	//  this.cells.splice(i, 1);
	//}
	break;
      }
      if (grow && cell.leaf) {
	cell.leaf = false;
	this.cells.splice(i, 1);
	this.growq.push(cell);
      }
    }
    this.growq.push({ x:0, y:this.height, stage:0, leaf:true });
    this.height++;
  },

  render: function (ctx, bx, by) {
    var tiles = this.scene.app.tiles;
    var tw = 16;
    var th = 16;
    if (this.cells.length == 0) {
      var bounds = this.getRect(0, 0);
      var tileno = 0;
      ctx.drawImage(tiles,
		    tileno*tw, 0, tw, th,
		    bx+bounds.x, by+bounds.y,
		    bounds.width, bounds.height);
    } else {
      for (var i = 0; i < this.cells.length; i++) {
	var cell = this.cells[i];
	var bounds = this.getRect(cell.x, cell.y);
	var tileno;
	if (cell.stage == 0) {
	  tileno = (this.scene.treeDead === 0)? 1 : 8;
	} else if (cell.stage == 1) {
	  tileno = 8;
	} else {
	  if ((cell.y % 2) == 0) {
	    tileno = 8;
	  } else {
	    switch (this.scene.treeDead) {
	    case 0:
	      if (cell.x == 0) {
		tileno = 2;
	      } else {
		tileno = (cell.leaf)? 4 : 3;
	      }
	      break;
	    case 1:
	      if (cell.x == 0) {
		tileno = 5;
	      } else {
		tileno = (cell.leaf)? 7 : 6;
	      }
	      break;
	    default:
	      if (cell.x == 0) {
		tileno = 9;
	      } else {
		tileno = (cell.leaf)? 11 : 10;
	      }
	      break;
	    }
	  }
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
function Balloon(bounds, growth)
{
  var tileno = (growth <= 2)? 3 : 4;
  this._Collectible(bounds, bounds.inflate(-2,-2), tileno);
  this.growth = growth;
}
  
define(Balloon, Collectible, 'Collectible', {
  update: function () {
    this.phase = blink(this.getTime(), 20)? 0 : 1;
    this._Collectible_update();
  },
  
  collide: function (obj) {
    if (this.scene.isActive()) {
      if (obj instanceof Pigeon) {
	playSound(this.scene.app.audios.pick);
	this.scene.updateEnergy(this.growth);
	this.die();
      }
    }
  },
});

// Humberger
function Humberger(bounds)
{
  this._Collectible(bounds, bounds.inflate(-2,-2), 8);
}
  
define(Humberger, Collectible, 'Collectible', {
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
  this.zorder = 1;
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

// Vulture
function Vulture(bounds)
{
  this._Actor2(bounds, bounds, 7);
  this.speed = rnd(2)? -2 : +2;
  this.velocity.x = this.speed;
}

define(Vulture, Actor2, 'Actor2', {
  update: function () {
    if (this.scene.isActive()) {
      if (this.hitbox !== null) {
	var v = this.getMove(this.velocity);
	if (v.x != this.velocity.x) {
	  this.speed = -this.speed;
	}
	this.velocity.x = this.speed;
      }
    }
    this.phase = blink(this.getTime(), 10)? 0 : 1;
    this._Actor2_update();
  },
});


// Pigeon
function Pigeon(bounds, health)
{
  this._Actor2(bounds, bounds, 0);
  this.health0 = health;
  this.health = health;
  this.speed = 2;
  this.jumpacc = -4;
  this.gravity = 1;
  this.maxspeed = 4;
  this.flying = false;
  this.invuln = 0;
}

define(Pigeon, Actor2, 'Actor2', {
  update: function () {
    if (this.scene.isActive()) {
      if (this.hitbox !== null) {
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
	  this.visible = blink(this.getTime(), 4);
	} else {
	  this.visible = true;
	}
      }
      this.velocity.y += this.gravity;
      this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
    } else {
      this.visible = true;
    }
    this.phase = blink(this.getTime(), 10)? 0 : 1;
    this._Actor2_update();
  },

  collide: function (obj) {
    if (this.scene.isActive()) {
      if (obj instanceof Humberger) {
	playSound(this.scene.app.audios.pick);
	this.health = this.health0;
	this.scene.updateHealth();
	obj.die();
      } else if (obj instanceof Hazard ||
		 obj instanceof Vulture) {
	//obj.die();
	if (this.invuln == 0) {
	  playSound(this.scene.app.audios.hurt);
	  this.health--;
	  this.scene.updateHealth();
	  if (this.health == 0) {
	    this.scene.app.lockKeys();
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
  addObject: function (obj) {
    if (obj instanceof Actor) {
      var f = (function (x) { return (x instanceof Actor); });
      if (obj.hitbox !== null) {
	var a = this.findObjects(obj.hitbox, f);
	if (a.length != 0) return false;
      }
    }
    this._GameScene_addObject(obj);
    return true;
  },
  
  init: function () {
    this._GameScene_init();
    this.app.set_music(this.app.audios.sound);

    var app = this.app;
    var tilesize = this.tilesize;
    var rect = MakeRect(this.world.anchor(0,-1)).expand(tilesize, tilesize, 0, -1);
    this.player = new Pigeon(rect.copy(), 5);
    this.addObject(this.player);
    this.tree = new Tree(rect.move(0, -tilesize));
    this.addObject(this.tree);
    this.goal = new Rect(0, 0, this.world.width, this.window.height/2);
    //this.goal = new Rect(0, 0, this.world.width, this.world.height-this.window.height*3);
    this.treeEnergy = 10;
    this.treeDead = 0;
    this.ending = false;

    var w = Math.floor(this.world.width/tilesize);
    var y0 = Math.floor(this.window.height/tilesize);
    var y1 = Math.floor((this.world.height-this.window.height)/tilesize);
    var y2 = Math.floor(this.world.height/2/tilesize);
    var y3 = Math.floor((this.world.height-this.window.height*2)/tilesize);
    
    var yb = Math.floor(this.world.height/tilesize)-5;
    for (var x = 0; x < w; x++) {
      var rect = new Rect(x*tilesize, yb*tilesize, tilesize, tilesize);
      var obj = new Brick(rect);
      this.addObject(obj);
    }
    for (var i = 0; i < 50; i++) {
      while (true) {
	var x = rnd(w);
	var y = rnd(y0, y1);
	y = Math.floor(y/2)*2+1;
	var rect = new Rect(x*tilesize, y*tilesize, tilesize, tilesize);
	var obj = new Brick(rect);
	if (this.addObject(obj)) break;
      }
    }
    
    for (var i = 0; i < 70; i++) {
      while (true) {
	var x = rnd(w);
	var y = rnd(y0, y1);
	var rect = new Rect(x*tilesize, y*tilesize, tilesize, tilesize);
	var obj = new Balloon(rect, (rnd(2)+1)*2);
	if (this.addObject(obj)) break;
      }
    }

    for (var i = 0; i < 5; i++) {
      while (true) {
	var x = rnd(w);
	var y = rnd(y0, y1);
	var rect = new Rect(x*tilesize, y*tilesize, tilesize, tilesize);
	var obj = new Humberger(rect);
	if (this.addObject(obj)) break;
      }
    }

    for (var i = 0; i < 30; i++) {
      while (true) {
	var x = rnd(w);
	var y = rnd(y0, y3);
	y = Math.floor(y/2)*2+1;
	var rect = new Rect(x*tilesize, y*tilesize, tilesize, tilesize);
	var obj = new Bomb(rect);
	if (this.addObject(obj)) break;
      }	
    }

    for (var i = 0; i < 10; i++) {
      while (true) {
	var x = rnd(w);
	var y = rnd(y0, y2);
	y = Math.floor(y/2)*2+1;
	var rect = new Rect(x*tilesize, y*tilesize, tilesize, tilesize);
	var obj = new Vulture(rect);
	if (this.addObject(obj)) break;
      }
    }

    var text = new TextBox(this.frame, app.font);
    this.textHealth = text.addSegment(new Vec2(2,2), '\x7f', app.colorfont);
    this.textEnergy = text.addSegment(new Vec2(2,2), '~', app.colorfont);
    this.addObject(text);
    
    rect = MakeRect(this.frame.anchor(0,1)).expand(100, 64, 0, 1).move(0, 20);
    this.textbox = new TextBoxTT(rect, app.font);
    this.textbox.zorder = 10;
    this.textbox.background = 'rgba(0,0,0,0.5)'
    this.textbox.padding = 8;
    this.textbox.linespace = 4;
    this.textbox.autohide = true;
    this.textbox.addDisplay('FLY BIRD..UP\n', 2);
    this.textbox.addDisplay('TREE...SPACE\n\n', 2);
    this.textbox.addDisplay('REACH MOON!', 2);
    this.textbox.addPause(app.framerate*2);
    this.addObject(this.textbox);

    this.updateHealth();
    this.updateEnergy(0);
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
    if (!this.ending) {
      this.setCenter(this.player.bounds.inflate(0, 60));
      if (this.player.bounds.overlap(this.goal)) {
	this.ending = true;
	this.app.lockKeys();
	this.initiateEnding();
      }
    } else {
      // ending.
      if (0 < this.treeDead) {
	this.window.y += 6;
	this.window.y = clamp(0, this.window.y, this.world.height-this.window.height);
	if (this.world.height-this.window.height*2 < this.window.y) {
	  if (this.treeDead != 3) {
	    this.treeDead = 3;
	    this.showCredit();
	  }
	} else if (this.world.height-this.window.height*4 < this.window.y) {
	  this.treeDead = 2;
	}
      }
    }
  },

  updateHealth: function () {
    this.textHealth.text = '';
    for (var i = 0; i < this.player.health; i++) {
      this.textHealth.text += '\x7f';
    }
  },

  updateEnergy: function (d) {
    this.treeEnergy += d;
    var n = Math.floor(this.treeEnergy/2);
    this.textEnergy.text = '';
    for (var i = 0; i < n; i++) {
      this.textEnergy.text += '~';
    }
    var s = this.app.font.getSize(this.textEnergy.text);
    this.textEnergy.bounds.x = this.frame.width-2-s.x;
  },

  initiateEnding: function () {
    this.textbox.clear();
    this.textbox.addDisplay('"TREE,\n I MADE IT!\n TO MOON!\n', 2);
    this.textbox.addPause(this.app.framerate);
    this.textbox.addDisplay('"BIRD, GOOD\n JOB SON,\n BUT I\'M TOO\n TIRED NOW..\n', 2);
    this.textbox.addPause(this.app.framerate*2);
    var task = new TextTask(this.textbox);
    var scene = this;
    task.duration = 1;
    task.died.subscribe(function () {
      scene.updateEnergy(-scene.treeEnergy);
      scene.treeDead = 1;
    });
    this.textbox.addTask(task);
  },

  showCredit: function () {
    this.textbox.clear();
    this.textbox.addDisplay('* PIGEON *\n\n', 2);
    this.textbox.addPause(this.app.framerate);
    this.textbox.addDisplay('CREATED BY\n  EUSKE\n  FOR LD34\n', 2);
    this.textbox.addPause(this.app.framerate*8);
  },
  
  keydown: function (key) {
    this._GameScene_keydown(key);
    if (this.textbox.visible && !this.ending) {
      this.textbox.ff();
      this.textbox.visible = false;
    } else if (this.player.health == 0) {
      // reset game.
      this.changeScene(new Game(this.app));
    }
  },

  isActive: function () {
    return (!this.textbox.visible && !this.ending);
  },

  set_dir: function (vx, vy) {
    this._GameScene_set_dir(vx, vy);
    this.player.flying = (vy < 0);
  },

  set_action: function (action) {
    this._GameScene_set_action(action);
    if (action) {
      if (0 < this.treeEnergy) {
	this.updateEnergy(-1);
	playSound(this.app.audios.grow);
	this.tree.growCells();
      }
    }
  },

});
