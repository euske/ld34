// game.js

// Obstacle
function Obstacle(bounds)
{
  this._Actor(bounds, bounds, 'red');
}
  
define(Obstacle, Actor, 'Actor', {
});


// Pigeon
function Pigeon(bounds)
{
  this._Actor(bounds, bounds, 0);
  this.speed = 4;
  this.jumpacc = -4;
  this.gravity = 1;
  this.maxspeed = 4;
  this.velocity = new Vec2();
  this.flying = false;
}

define(Pigeon, Actor, 'Actor', {
  update: function () {
    this._Actor_update();
    
    if (this.flying) {
      this.velocity.y = this.jumpacc;
      this.tileno = 1;
    } else {
      this.tileno = 0;
    }
    this.velocity.x = this.speed;
    this.velocity.y += this.gravity;
    this.velocity.y = clamp(-this.maxspeed, this.velocity.y, this.maxspeed);
    var v = this.velocity.copy();
    {
      var rect = this.hitbox.copy();
      var d0 = this.hitbox.contactHLine(v.copy(), this.scene.groundY,
					-Infinity, +Infinity);
      rect.x += d0.x;
      rect.y += d0.y;
      v.x -= d0.x;
      v.y -= d0.y;
      var d1 = this.hitbox.contactHLine(new Vec2(v.x,0), this.scene.groundY,
					-Infinity, +Infinity);
      v.x = d0.x+d1.x;
      v.y = d0.y+d1.y;
    }
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
    this.flapped = (this.velocity.x < 0);
    this.phase = blink(this.getTime(), 10)? 0 : 1;
    this.move(v.x, v.y);
  },
});


//  Game
// 
function Game(app)
{
  this._GameScene(app);
  this.window = this.frame.copy();
}

define(Game, GameScene, 'GameScene', {
  init: function () {
    this._GameScene_init();

    var app = this.app;
    this.groundY = this.frame.height;
    this.player = new Pigeon(new Rectangle(0,this.groundY-16, 16,16));
    this.addObject(this.player);
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
    //this.window.x = clamp(0, this.window.x, this.world.width-this.window.width);
    //this.window.y = clamp(0, this.window.y, this.groundY-this.window.height);
    this.window.y = Math.min(this.window.y, this.groundY-this.window.height);
  },

  render: function (ctx, bx, by) {
    // Fill with the background color.
    ctx.fillStyle = 'rgb(0,100,255)';
    ctx.fillRect(bx, by, this.frame.width, this.frame.height);
    
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
    this.setCenter(this.player.bounds.inflate(60, 40));
    if (rnd(10) == 0) {
      var y = this.window.y+rnd(this.window.height);
      var rect = new Rectangle(this.window.right(), y, 16, 16);
      var obj = new Obstacle(rect);
      this.addObject(obj);
    }
  },

  keydown: function (key) {
    this._GameScene_keydown(key);
  },

  set_action: function (action) {
    this._GameScene_set_action(action);
    this.player.flying = action;
  },

});
