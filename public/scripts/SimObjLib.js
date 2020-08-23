let debug = false;
let e; //later used to store canvas element
let windowProperties = {width:null,height:null};
class baseObj {
  /**
   * 
   * @param {x:number,y:number} position Position in simulation
   * @param {x:number,y:number} dimensions Dimensions of object, defaults to {x:0,y:0}
   */
  constructor(position, dimensions, properties) {
    this.pos = createVector(position.x,position.y) || null;
    this.shape = properties.shape
    if (this.shape == "ellipse") {
      this.dim = dimensions || {diam:0}
    } else if (this.shape == "quadrilateral") { //Assign dimensions dict based on shape
      this.dim = dimensions || { x: 0, y: 0 };
    }
  };
  update(){
    if (this.shape == "ellipse") {
      ellipse(this.pos.x, this.pos.y, this.dim.diam);
    } else if (this.shape == "quadrilateral") { //Draw shape in sim based 
      rect(this.pos.x-this.dim.x/2,this.pos.y-this.dim.y/2,this.dim.x,this.dim.y); 
    }
  }
  logstuff(){
    console.log("Last tick: ",this.lasttick) //Debug logging
    console.log("Position and velocity: ",this.pos,this.velocity)
  }
  save(){
    return {
      pos : {x:this.pos.x,y:this.pos.y},
      shape : this.shape,
      dim : this.dim,
      shape : null
    }
  }
};

class staticObj extends baseObj {
  constructor(position, dimensions, properties) {
    super(position, dimensions, properties);
    this.type = 'static'
  };
  save(){
    return {
      pos : {x:this.pos.x,y:this.pos.y},
      shape : this.shape,
      dim : this.dim,
      type : this.type,
      properties : this.properties,
    }
  }
  clicked(x,y){
    return collidePointRect(x,y,this.pos.x,this.pos.y,this.dim.x,this.dim.y)
  }
}

class dynObj extends baseObj {
  /**
   * 
   * @param {*} position {x:number, y:number}
   * @param {*} dimensions {x: number, y:number}
   * @param {*} suvat {s:{x:number, y:number}, u:...,t:number}
   * @param {*} properties 
   */
  constructor(position, dimensions, suvat, properties) {
    super(position, dimensions, properties); //Assign basic shape properties
    //Assign non-vectors for simulation
    if (this.shape == "ellipse"){
      this.body = new eDynObj(this.dim, properties.efficiency, this)
    } else if (this.shape == "quadrilateral") {
      this.body = new qDynObj(this.dim, properties.efficiency, this)
    }
    this.type = 'dynamic'
    this.properties = properties 
    this.properties.start = this.properties.start || {};
    this.mass = this.properties.mass || 0;
    this.efficiency = properties.efficiency;
    this.gravity = properties.gravity || false
    this.time = 0;
    this.suvat = suvat;
    //Assign vectors for simulation
    this.start = createVector(this.properties.start.x, this.properties.start.y);
    this.displacement = this.getDistance(this.start,this.pos) || suvat.s || createVector(0,0);
    this.initialv = createVector(suvat.u.x, suvat.u.y) || createVector(suvat.v.x, suvat.v.y)|| createVector(0,0);
    this.velocity = this.initialv.copy();
    this.accel = createVector(suvat.a.x, suvat.a.y) || createVector(0,0);
    this.momentum = p5.Vector.mult(this.velocity, this.mass);
  };
  save(){
    return {
      startpos : {x:this.start.x,y:this.start.y},
      shape : this.shape,
      dim : this.dim,
      type : this.type,
      properties : this.properties,
      mass : this.mass,
      efficiency : this.efficiency,
      suvat : this.suvat,
    }
  }
  getDistance(a,b){
    /**
     * @param {p5.Vector} a
     * @param {p5.Vector} b
     * Returns the distance vector of a -> b
     */
    if (a == undefined || b == undefined) return false; //Returns false if missing args
    var dist = p5.Vector.sub(b,a)
    return dist
  };
  tick(ticksize) {
    let self = this //Allows instance to be used in callback
    this.assignLastTick(function(lasttick){
      self.lasttick = lasttick
      self.time = self.time + ticksize
      self.updateSuvat(ticksize)
    })    
  };
  updateSuvat(timepassed){
    if (this.accel != 0 && this.accel != {x:0,y:0}) { //If accelerating
      this.velocity.add(p5.Vector.mult(this.accel,timepassed))
      this.momentum = p5.Vector.mult(this.velocity, this.mass);
      this.displacement.add(p5.Vector.mult(this.velocity,timepassed))
    } else if (this.velocity != 0 && this.velocity != {x:0,y:0}) { //If not accelerating, but moving
      this.displacement.add(p5.Vector.mult(this.velocity,timepassed))
    }
    //Move the object by the displacement gained this tick
    if (timepassed > 0){
      this.pos.add(this.getDistance(this.lasttick.s,this.displacement)) 
    }
  };
  assignLastTick(callback){
    //Copy the instances of all simulation values that change tick-by-tick, for reference
    var lasttick = {
      s:this.displacement.copy(),
      u:this.initialv.copy(),
      v:this.velocity.copy(), 
      a:this.accel.copy(), 
      t:this.time,
      p:this.momentum.copy(),
      pos:this.pos.copy(),
      time:this.time
    };
    return callback(lasttick); //Pass the dict to the callback function
  };
  amIColliding(colliders){
    var collisions = this.body.amIColliding(colliders,this.pos)
    if (collisions.length > 0) { //If any collisions happened
      this.resolve(collisions)
    }
  }
  resolve(collisions) {
    for (var i in collisions) {
      //Object collision logic block
      if (collisions[i].type == 'dynamic'){
        //Assigns new velocities assuming full elasticity, scales by a efficiency scalar to emulate non-elastic collisions
        var a = collisions[i].collider
        var b = this
        var av = p5.Vector.div(
          p5.Vector.sub(
            p5.Vector.mult(a.velocity,a.mass*2),
            p5.Vector.mult(b.velocity,a.mass-b.mass)
            ),
          a.mass + b.mass)
        var bv = p5.Vector.add(p5.Vector.sub(a.velocity, b.velocity),av)
        a.velocity = p5.Vector.mult(av,a.efficiency*-1)
        b.velocity = p5.Vector.mult(bv,b.efficiency)
        //Update the momentum
        a.momentum = p5.Vector.mult(a.velocity,a.mass)
        b.momentum = p5.Vector.mult(b.velocity,b.mass)
        //Position correction
        var res = this.body.resolve(collisions[i], this.pos.copy(), this.velocity) 
        this.pos = res.pos
      } else if (collisions[i].type == 'boundary') {
        var res = this.body.resolve(collisions[i], this.pos.copy(), this.velocity.copy())
        this.velocity = res.vel
        this.pos = res.pos
      } else {
        var res = this.body.resolve(collisions[i], this.pos.copy(), this.velocity.copy())
        this.pos = res.pos
        this.velocity = res.vel
      }

    }
    if (debug) {
      console.log("Object colliding! ", collisions, this.time)
      playpause()
    }
    if (pauseOnCollision){
      playpause()
    }
  }
  clicked(x,y){
    return this.body.clicked(x,y,this.pos.copy())
  }
}

class eDynObj {
  constructor (dim, eff, parent) {
    this.dim = dim
    this.efficiency = eff
    this.parent = parent
  }
  amIColliding(colliders,pos){
    var collisions = [] //Keep track of all collisions this tick
    //Boundary detection logic block
    if (pos.x > windowProperties.width - this.dim.diam/2) {
      collisions.push({type:'boundary', direction:'right'})
    };
    if (pos.x < this.dim.diam/2) {
      collisions.push({type:'boundary', direction:'left'})
    };
    if (pos.y < this.dim.diam/2) {
      collisions.push({type:'boundary', direction:'top'})
    };
    if (pos.y > windowProperties.height - this.dim.diam/2) {
      collisions.push({type:'boundary', direction:'bottom'})
    };  
    //Object collision logic block
    for (var i in colliders) {
      if (colliders[i].shape == "ellipse") {
        if (collideCircleCircle(pos.x,pos.y,this.dim.diam, colliders[i].pos.x, colliders[i].pos.y, colliders[i].dim.diam)) {
          collisions.push({type:colliders[i].type,collider:colliders[i]})
        }
      } else if (colliders[i].shape == "quadrilateral") {
        if (collideRectCircle(colliders[i].pos.x-colliders[i].dim.x/2, colliders[i].pos.y-colliders[i].dim.y/2, colliders[i].dim.x, colliders[i].dim.y, pos.x, pos.y, this.dim.diam)) {
          collisions.push({type:colliders[i].type,collider:colliders[i]})
        }
      }
    }    
    return collisions
  }
  resolve(collision, pos, velocity){
    if (collision.type == 'boundary') {
      switch(collision.direction) {
        case 'right':
          pos.x = windowProperties.width - this.dim.diam/2;
          velocity.x *= -1 * this.efficiency;
          break;
        case 'left':
          pos.x = this.dim.diam/2;
          velocity.x *= -1 * this.efficiency;
          break;
        case 'top':
          pos.y = this.dim.diam/2;
          velocity.y *= -1 * this.efficiency;
          break;
        case 'bottom':
          pos.y = windowProperties.height - this.dim.diam/2;
          velocity.y *= -1 * this.efficiency;
          break;
      };
      return {'pos':pos,'vel':velocity}
    } else if (collision.type == "dynamic") {
        if (collision.collider.shape == 'ellipse') {
          while (collideCircleCircle(pos.x,pos.y,this.dim.diam, collision.collider.pos.x, collision.collider.pos.y, collision.collider.dim.diam)) {
            var dist = this.parent.getDistance(pos,collision.collider.pos)
            var separation = dist.copy();
            separation.setMag(Math.ceil(this.dim.diam / 2 +  collision.collider.dim.diam  / 2));
            var discrepancy = p5.Vector.sub(separation, dist).div(2)
            discrepancy.setMag(Math.ceil(discrepancy.mag()))
            pos.sub(discrepancy)
            collision.collider.pos.add(discrepancy)           
          } 
        } else if (collision.collider.shape == "quadrilateral") {
          var col = collision.collider
          var dist = this.parent.getDistance(pos,collision.collider.pos)        
          var discrepancyx = Math.ceil(((this.dim.diam + col.dim.x)/2) - Math.abs(dist.x))
          var discrepancyy = Math.ceil(((this.dim.diam + col.dim.y)/2) - Math.abs(dist.y))
          if (discrepancyx < discrepancyy){
            var discrepancy = discrepancyx / 2
            if (dist.x < 0) {
              pos.x = pos.x - discrepancy
              col.pos.x = col.pos.x + discrepancy
            } else if (dist.x > 0){
              pos.x = pos.x + discrepancy
              col.pos.x = col.pos.x - discrepancy
            }
          } else if (discrepancyy < discrepancyx){
            var discrepancy = discrepancyy / 2
            if (dist.y < 0) {
              pos.y = pos.y - discrepancy
              col.pos.y = col.pos.y + discrepancy
            } else if (dist.x > 0){
              pos.y = pos.y + discrepancy
              col.pos.y = col.pos.y - discrepancy
            }
          } else {
            if (dist.x < 0) {
              pos.x = pos.x - discrepancyx/2
              col.pos.x = col.pos.x + discrepancyx/2
            } else if (dist.x > 0){
              pos.x = pos.x + dicrepancyx/2
              col.pos.x = col.pos.x - discrepancyx/2
            }
            if (dist.y < 0) {
              pos.y = pos.y - discrepancyy/2
              col.pos.y = col.pos.y + discrepancyy/2            
            } else if (dist.x > 0){
              pos.y = pos.y + discrepancyy/2
              col.pos.y = col.pos.y - discrepancyy/2             
            }
          }
        }
        return {'pos':pos}
    } else {
      var col = collision.collider
      var dist = this.parent.getDistance(pos,collision.collider.pos)        
      var discrepancyx = Math.ceil(((this.dim.diam + col.dim.x)/2) - Math.abs(dist.x))
      var discrepancyy = Math.ceil(((this.dim.diam + col.dim.y)/2) - Math.abs(dist.y))
      if (discrepancyx < discrepancyy){
        var discrepancy = discrepancyx
        if (dist.x < 0) {
          pos.x = pos.x + discrepancy
        } else if (dist.x > 0){
          pos.x = pos.x - discrepancy
        }
        velocity.x = velocity.x * -1
      } else if (discrepancyy < discrepancyx){
        var discrepancy = discrepancyy
        if (dist.y < 0) {
          pos.y = pos.y + discrepancy
        } else if (dist.x > 0){
          pos.y = pos.y - discrepancy
        }
        velocity.y = velocity.y * -1
      } else {
        if (dist.x < 0) {
          pos.x = pos.x + discrepancyx
        } else if (dist.x > 0){
          pos.x = pos.x - dicrepancyx
        }
        if (dist.y < 0) {
          pos.y = pos.y + discrepancyy
        } else if (dist.x > 0){
          pos.y = pos.y - discrepancyy
        }
        velocity.mult(-1)
      }
      return {'pos':pos,'vel':velocity}
    }
  }
  clicked(x,y,pos) {
    return collidePointCircle(x,y,pos.x,pos.y,this.dim.diam)
  }
}
class qDynObj {
  constructor (dim, eff, parent) {
    this.dim = dim
    this.efficiency = eff
    this.parent = parent
  }
  amIColliding(colliders, pos){
    var collisions = [] //Keep track of all collisions this tick
    //Boundary detection logic block
    if (pos.x > windowProperties.width - this.dim.x/2) {
       collisions.push({type:'boundary', direction:'right'})
    };
    if (pos.x < this.dim.x/2) {
      collisions.push({type:'boundary', direction:'left'})
    };
    if (pos.y < this.dim.y/2) {
      collisions.push({type:'boundary', direction:'top'})
    };
    if (pos.y > windowProperties.height - this.dim.y/2) {
      collisions.push({type:'boundary', direction:'bottom'})
    };
    //Object collision logic block
    for (var i in colliders) {
      if (colliders[i].shape == "quadrilateral") {
        if (collideRectRect(pos.x-this.dim.x/2, pos.y-this.dim.y/2, this.dim.x, this.dim.y, colliders[i].pos.x-colliders[i].dim.x/2, colliders[i].pos.y-colliders[i].dim.y/2, colliders[i].dim.x, colliders[i].dim.y)) {
          collisions.push({type:colliders[i].type,collider:colliders[i]})
        }
      } else if (colliders[i].shape == "ellipse") {
        if (collideRectCircle(pos.x-this.dim.x/2, pos.y-this.dim.y/2, this.dim.x, this.dim.y, colliders[i].pos.x, colliders[i].pos.y, colliders[i].dim.diam)) {
          collisions.push({type:colliders[i].type,collider:colliders[i]})
        }
      }
    }  
    return collisions    
  }
  resolve(collision, pos, velocity) {
    if (collision.type == 'boundary') {
      switch(collision.direction) {
        case 'right':
          pos.x = windowProperties.width - this.dim.x/2;
          velocity.x *= -1 * this.efficiency;
          break;
        case 'left':
          pos.x = this.dim.x/2;
          velocity.x *= -1 * this.efficiency;
          break;
        case 'top':
          pos.y = this.dim.y/2;
          velocity.y *= -1 * this.efficiency;
          break;
        case 'bottom':
          pos.y = windowProperties.height - this.dim.y/2;
          velocity.y *= -1 * this.efficiency;
          break;
      };
      return {'pos':pos,'vel':velocity}
    } else if (collision.type == "dynamic"){
      if (collision.collider.shape == 'ellipse') {
        var col = collision.collider
          var dist = this.parent.getDistance(pos,collision.collider.pos)        
          var discrepancyx = Math.ceil(((this.dim.x + col.dim.diam)/2) - Math.abs(dist.x))
          var discrepancyy = Math.ceil(((this.dim.y + col.dim.diam)/2) - Math.abs(dist.y))
          if (discrepancyx < discrepancyy){
            var discrepancy = discrepancyx / 2
            if (dist.x < 0) {
              pos.x = pos.x - discrepancy
              col.pos.x = col.pos.x + discrepancy
            } else if (dist.x > 0){
              pos.x = pos.x + discrepancy
              col.pos.x = col.pos.x - discrepancy
            }
          } else if (discrepancyy < discrepancyx){
            var discrepancy = discrepancyy / 2
            if (dist.y < 0) {
              pos.y = pos.y - discrepancy
              col.pos.y = col.pos.y + discrepancy
            } else if (dist.x > 0){
              pos.y = pos.y + discrepancy
              col.pos.y = col.pos.y - discrepancy
            }
          } else {
            if (dist.x < 0) {
              pos.x = pos.x - discrepancyx/2
              col.pos.x = col.pos.x + discrepancyx/2
            } else if (dist.x > 0){
              pos.x = pos.x + dicrepancyx/2
              col.pos.x = col.pos.x - discrepancyx/2
            }
            if (dist.y < 0) {
              pos.y = pos.y - discrepancyy/2
              col.pos.y = col.pos.y + discrepancyy/2            
            } else if (dist.x > 0){
              pos.y = pos.y + discrepancyy/2
              col.pos.y = col.pos.y - discrepancyy/2             
            }
          }
          return {'pos':pos}
        } else if (collision.collider.shape == 'quadrilateral'){
          var col = collision.collider;
          var dist = this.parent.getDistance(pos,collision.collider.pos)
          var discrepancyx = Math.ceil(((this.dim.x + col.dim.x)/2) - Math.abs(dist.x))
          var discrepancyy = Math.ceil(((this.dim.y + col.dim.y)/2) - Math.abs(dist.y))
          if (discrepancyx < discrepancyy){
            var discrepancy = discrepancyx / 2
            if (dist.x < 0) {
              pos.x = pos.x + discrepancy
              col.pos.x = col.pos.x - discrepancy
            } else if (dist.x > 0){
              pos.x = pos.x - discrepancy
              col.pos.x = col.pos.x + discrepancy
            }
          } else if (discrepancyy < discrepancyx){
            var discrepancy = discrepancyy / 2
            if (dist.y < 0) {
              pos.y = pos.y + discrepancy
              col.pos.y = col.pos.y - discrepancy
            } else if (dist.x > 0){
              pos.y = pos.y - discrepancy
              col.pos.y = col.pos.y + discrepancy
            }
          } else {
            if (dist.x < 0) {
              pos.x = pos.x + discrepancyx/2
              col.pos.x = col.pos.x - discrepancyx/2
            } else if (dist.x > 0){
              pos.x = pos.x - dicrepancyx/2
              col.pos.x = col.pos.x + discrepancyx/2
            }
            if (dist.y < 0) {
              pos.y = pos.y + discrepancyy/2
              col.pos.y = col.pos.y - discrepancyy/2            
            } else if (dist.x > 0){
              pos.y = pos.y - discrepancyy/2
              col.pos.y = col.pos.y + discrepancyy/2             
            }
          }
          return {'pos':pos}
        }
    } else {
      var col = collision.collider;
      var dist = this.parent.getDistance(pos,collision.collider.pos)
      var discrepancyx = Math.ceil(((this.dim.x + col.dim.x)/2) - Math.abs(dist.x))
      var discrepancyy = Math.ceil(((this.dim.y + col.dim.y)/2) - Math.abs(dist.y))
      if (discrepancyx < discrepancyy){
        var discrepancy = discrepancyx 
        if (dist.x < 0) {
          pos.x = pos.x + discrepancy
          velocity.x = velocity.x * -1
        } else if (dist.x > 0){
          pos.x = pos.x - discrepancy
          velocity.x = velocity.x * -1
        }
      } else if (discrepancyy < discrepancyx){
        var discrepancy = discrepancyy 
        if (dist.y < 0) {
          pos.y = pos.y + discrepancy
          velocity.y = velocity.y * -1
        } else if (dist.x > 0){
          pos.y = pos.y - discrepancy
          velocity.y = velocity.y * -1
        }
      } else {
        if (dist.x < 0) {
          pos.x = pos.x + discrepancyx
          velocity.x = velocity.x * -1
        } else if (dist.x > 0){
          pos.x = pos.x - dicrepancyx
          velocity.x = velocity.x * -1
        }
        if (dist.y < 0) {
          pos.y = pos.y + discrepancyy
          velocity.y = velocity.y * -1
        } else if (dist.x > 0){
          pos.y = pos.y - discrepancyy
          velocity.y = velocity.y * -1
        }
      }
      return {'pos':pos,'vel':velocity}
    }
  }
  clicked(x,y,pos) {
    return collidePointRect(x,y,pos.x,pos.y,this.dim.x,this.dim.y)
  }
}