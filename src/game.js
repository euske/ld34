// game.js

// Obstacle
function Obstacle(bounds)
{
  this._Actor(bounds, bounds, 'red');
}
  
define(Obstacle, Actor, 'Actor', {
});


// Actor2
function Actor2(bounds, hitbox, tileno)
{
  this._Actor(bounds, hitbox, tileno);
  this.velocity = new Vec2();
}

define(Actor2, Actor, 'Actor', {
  update: function () {
    this._Actor_update();
    var v = this.velocity.copy();
    var hitbox2 = this.hitbox.union(this.hitbox.movev(v));
    var objs = this.scene.colliders;
    for (var i = 0; i < objs.length; i++) {
      var obj = objs[i];
      if (obj instanceof Obstacle && obj.hitbox !== null &&
	  obj.hitbox.overlap(hitbox2)) {
	var rect = this.hitbox.copy();
	var d0 = rect.contact(v.copy(), obj.hitbox);
	rect.x += d0.x;
	rect.y += d0.y;
	v.x -= d0.x;
	v.y -= d0.y;
	var d1 = rect.contact(new Vec2(0,v.y), obj.hitbox);
	rect.x += d1.x;
	rect.y += d1.y;
	v.x -= d1.x;
	v.y -= d1.y;
	var d2 = rect.contact(new Vec2(v.x,0), obj.hitbox);
	v.x = d0.x+d1.x+d2.x;
	v.y = d0.y+d1.y+d2.y;
      }
    }
    this.velocity = v;
    this.flipped = (this.velocity.x < 0);
    this.move(v.x, v.y);
    var rect = this.hitbox.clamp(this.scene.world);
    v = rect.diff(this.hitbox);
    this.move(v.x, v.y);
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
}

define(Pigeon, Actor2, 'Actor2', {
  update: function () {
    if (this.flying) {
      this.velocity.y = this.jumpacc;
      this.tileno = 1;
    } else {
      this.tileno = 0;
    }
    if (this.hitbox.x + this.velocity.x < this.scene.world.x ||
	this.scene.world.right() < this.hitbox.right() + this.velocity.x) {
      this.speed = -this.speed;
    }
    this.velocity.x = this.speed;
    this.velocity.y += this.gravity;
    this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
    this.phase = blink(this.getTime(), 10)? 0 : 1;
    this._Actor2_update();
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
    this.player = new Pigeon(new Rect(0,this.world.bottom()-tilesize, tilesize,tilesize));
    this.addObject(this.player);
    
    for (var i = 0; i < 20; i++) {
      var x = rnd(Math.floor(this.world.width/tilesize));
      var y = rnd(Math.floor(this.world.height/tilesize));
      var rect = new Rect(x*tilesize, y*tilesize, tilesize, tilesize);
      var obj = new Obstacle(rect);
      this.addObject(obj);
    }
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
    // Fill with the background color.
    ctx.clearRect(bx, by, this.frame.width, this.frame.height);
    var by1 = this.window.y/4;
    ctx.drawImage(this.app.images.bkgnd1,
		  this.window.x, by1, this.window.width, this.window.height,
		  bx, by, this.frame.width, this.frame.height);
    var by2 = 1000-this.window.y/2;
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
  },

  keydown: function (key) {
    this._GameScene_keydown(key);
  },

  set_action: function (action) {
    this._GameScene_set_action(action);
    this.player.flying = action;
  },

});
