class three60 {
  constructor() {
    this.debug = true;
    this.container = null;
    this.canvas = null;
    this.canvasContext = null;
    this.containerName = null;
    this.fileName = null;
    this.totalFrames = null;
    this.framesLoaded = 0;
    this.frameIndex = 1;
    this.lastFrameIndex = 1;
    this.dragging = false;
    this.lastScreenX = 0;
    this.inertiaInterval = null;
    this.direction = null;
    this.frameSpeed = 0;
    this.inertiaFrameSpeed = 0;
    this.timeInertia = 0;
    this.inertiaDuration = 0;
    this.imageObjects = [];
    this.RAFrunning = false;
    this.imageFrame = false;
  }

  init(container, fileName, totalFrames) {
    this.container = document.querySelector('#' + container);
    this.canvas = document.getElementById(container);
    this.canvasContext = this.canvas.getContext('2d');
    this.fileName = fileName;
    this.totalFrames = totalFrames;
    this.frameIndex = totalFrames;
    this.containerName = container;

    Math.easeOutCirc = (b, d, a, c) => a * Math.sqrt(1 - (b = b / c - 1) * b) + d;

    window.requestAnimFrame = (function() {
      return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function(callback) {
          window.setTimeout(callback, 1000 / 60);
        };
    })();

    // TODO: add loader.
    this.setCanvasDimension();
    this.loadFrames();
  }

  loadFrames() {
    let self = this;

    for (let i = 1; i <= self.totalFrames; i++) {
      self.imageObjects[i] = new Image();
      self.imageObjects[i].src = self.fileName.replace("{i}", i);

      self.imageObjects[i].onload = function() {
        self.framesLoaded++;

        if (self.framesLoaded === self.totalFrames) {
          self.canvasContext.drawImage(this, 0, 0);
          self.loadComplete();
        }
      };
    }
  }

  setCanvasDimension() {
    let frame = new Image();

    frame.src = this.fileName.replace('{i}', 1);

    frame.onload = () => {
      this.canvas.width = frame.width;
      this.canvas.height = frame.height;
    }
  }

  loadComplete() {
    let imgFrame;

    // TODO: remove loader.
    this.attachHandlers();
  }

  attachHandlers() {
    // handlers for mobile
    if (typeof document.ontouchstart !== 'undefined' && typeof document.ontouchmove !== 'undefined' && typeof document.ontouchend !== 'undefined' && typeof document.ontouchcancel !== 'undefined') {
      this.canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.down(e.touches[0].pageX);
      });

      this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        this.move(e.touches[0].pageX);
      });

      this.canvas.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.up();
      });

      this.canvas.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        this.up();
      });
    }

    // handlers for desktop
    this.container.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.down(e.screenX);
    });

    this.container.addEventListener('mousemove', (e) => {
      e.preventDefault();
      this.move(e.screenX);
    });

    this.container.addEventListener('mouseup', (e) => {
      e.preventDefault();
      this.up();
    });

    this.container.addEventListener('mouseout', (e) => {
      e.preventDefault();

      let relatedTarget = ('relatedTarget' in e ? e.relatedTarget : e.toElement);

      if (relatedTarget.id === this.containerName) {
        return false;
      }

      this.up();
    });
  }

  down(x) {
    this.dragging = true;
    this.lastScreenX = x;
    this.stopInertia();
  }

  move(x) {
    if (this.dragging) {
      this.frameSpeed = (parseInt(Math.abs(this.lastScreenX - x) * 0.05) === 0 ? 1 : parseInt(Math.abs(this.lastScreenX - x) * 0.05));
      this.lastFrameIndex = this.frameIndex;

      if (x > this.lastScreenX) {
        this.frameIndex = this.frameIndex - this.frameSpeed;
        this.direction = 'left';
      }
      else if (x < this.lastScreenX) {
        this.direction = 'right';
        this.frameIndex = this.frameIndex + this.frameSpeed;
      }

      if (this.frameIndex > this.totalFrames) {
        this.frameIndex = 1;
      }

      if (this.frameIndex < 1) {
        this.frameIndex = this.totalFrames;
      }

      if (this.lastFrameIndex !== this.lastScreenX) {
        this.updateFrames();
      }

      this.lastScreenX = x;
    }
  }

  up() {
    this.dragging = false;

    if (this.frameSpeed > 1) {
      this.inertia();
    }
  }

  inertia() {
    this.inertiaDuration = this.frameSpeed;
    this.inertiaFrameSpeed = 0;

    if (!this.RAFrunning) {
      requestAnimFrame(this.inertiaRAF);
    }

    this.RAFrunning = true;
  }

  inertiaRAF() {
    this.timeInertia += 0.04;
    this.frameSpeed = this.inertiaDuration - parseInt(Math.easeOutCirc(this.timeInertia, 0, this.inertiaDuration, this.inertiaDuration));
    this.inertiaFrameSpeed += this.inertiaDuration - Math.easeOutCirc(this.timeInertia, 0, this.inertiaDuration, this.inertiaDuration);

    if (this.inertiaFrameSpeed >= 1) {
      this.lastFrameIndex = this.frameIndex;

      if (this.direction === 'right') {
        this.frameIndex = this.frameIndex + Math.floor(this.inertiaFrameSpeed);
      }
      else {
        this.frameIndex = this.frameIndex - Math.floor(this.inertiaFrameSpeed);
      }

      if (this.frameIndex > this.totalFrames) {
        this.frameIndex = 1;
      }

      if (this.frameIndex < 1) {
        this.frameIndex = this.totalFrames;
      }

      this.inertiaFrameSpeed = 0;
      this.updateFrames();
    }

    if (this.timeInertia > this.inertiaDuration || this.frameSpeed < 1) {
      this.stopInertia();
    }
    else {
      requestAnimFrame(this.inertiaRAF);
    }
  }

  stopInertia() {
    this.timeInertia = 0;
    this.inertiaDuration = 0;
    this.RAFrunning = false;
  }

  updateFrames() {
    let self = this;

    self.imageFrame = new Image();
    self.imageFrame.src = self.fileName.replace("{i}", self.frameIndex);

    self.imageFrame.onload = function() {
      self.canvasContext.drawImage(this, 0, 0);
    }
  }
}