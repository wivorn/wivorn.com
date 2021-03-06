// JS Goes here - ES6 supported

import './css/main.css';
import $ from 'jquery';
import cloudinary from 'cloudinary-core';

(function() {
  const cl = cloudinary.Cloudinary.new({ cloud_name: 'wivorn' });
  cl.responsive();

  function SiriWave(opt) {
    opt = opt || {};

    this.phase = 0;
    this.run = false;

    // UI vars

    this.ratio = opt.ratio || window.devicePixelRatio || 1;

    this.width = this.ratio * (opt.width || 320);
    this.width_2 = this.width / 2;
    this.width_4 = this.width / 4;

    this.height = this.ratio * (opt.height || 100);
    this.height_2 = this.height / 2;

    this.MAX = this.height_2 - 4;

    // Constructor opt

    this.amplitude = opt.amplitude || 1;
    this.speed = opt.speed || 0.2;
    this.frequency = opt.frequency || 6;
    this.color =
      (function hex2rgb(hex) {
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
          return r + r + g + g + b + b;
        });
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? parseInt(result[1], 16).toString() + ',' + parseInt(result[2], 16).toString() + ',' + parseInt(result[3], 16).toString() : null;
      })(opt.color || '#fff') || '255,255,255';

    // Interpolation

    this.speedInterpolationSpeed = opt.speedInterpolationSpeed || 0.005;
    this.amplitudeInterpolationSpeed = opt.amplitudeInterpolationSpeed || 0.05;

    this._interpolation = {
      speed: this.speed,
      amplitude: this.amplitude
    };

    // Canvas

    this.canvas = document.getElementById('signal-inner');
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if (opt.cover) {
      this.canvas.style.width = this.canvas.style.height = '100%';
    } else {
      this.canvas.style.width = this.width / this.ratio + 'px';
      this.canvas.style.height = this.height / this.ratio + 'px';
    }

    this.container = opt.container || document.body;
    this.container.appendChild(this.canvas);

    this.ctx = this.canvas.getContext('2d');

    // Start

    if (opt.autostart) {
      this.start();
    }
  }

  SiriWave.prototype._interpolate = function(propertyStr) {
    const increment = this[propertyStr + 'InterpolationSpeed'];

    if (Math.abs(this._interpolation[propertyStr] - this[propertyStr]) <= increment) {
      this[propertyStr] = this._interpolation[propertyStr];
    } else {
      if (this._interpolation[propertyStr] > this[propertyStr]) {
        this[propertyStr] += increment;
      } else {
        this[propertyStr] -= increment;
      }
    }
  };

  SiriWave.prototype._GATF_cache = {};
  SiriWave.prototype._globAttFunc = function(x) {
    if (SiriWave.prototype._GATF_cache[x] == null) {
      SiriWave.prototype._GATF_cache[x] = Math.pow(4 / (4 + Math.pow(x, 4)), 4);
    }
    return SiriWave.prototype._GATF_cache[x];
  };

  SiriWave.prototype._xpos = function(i) {
    return this.width_2 + i * this.width_4;
  };

  SiriWave.prototype._ypos = function(i, attenuation) {
    var att = (this.MAX * this.amplitude) / attenuation;
    return this.height_2 + this._globAttFunc(i) * att * Math.sin(this.frequency * i - this.phase);
  };

  SiriWave.prototype._drawLine = function(attenuation, color, width) {
    this.ctx.moveTo(0, 0);
    this.ctx.beginPath();
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width || 1;

    var i = -2.1;
    while ((i += 0.01) <= 2.1) {
      var y = this._ypos(i, attenuation);
      if (Math.abs(i) >= 1.9) y = this.height_2;
      this.ctx.lineTo(this._xpos(i), y);
    }

    this.ctx.stroke();
  };

  SiriWave.prototype._clear = function() {
    this.ctx.globalCompositeOperation = 'destination-out';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.globalCompositeOperation = 'source-over';
  };

  SiriWave.prototype._draw = function() {
    this._drawLine(-2, 'rgba(' + this.color + ',0.1)');
    this._drawLine(-6, 'rgba(' + this.color + ',0.2)');
    this._drawLine(4, 'rgba(' + this.color + ',0.4)');
    this._drawLine(2, 'rgba(' + this.color + ',0.6)');
    this._drawLine(1, 'rgba(' + this.color + ',1)', 1.5);
  };

  SiriWave.prototype._startDrawCycle = function() {
    if (this.run === false) return;
    this._clear();

    // Interpolate values
    this._interpolate('amplitude');
    this._interpolate('speed');

    this._draw();
    this.phase = (this.phase + Math.PI * this.speed) % (2 * Math.PI);

    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(this._startDrawCycle.bind(this));
    } else {
      setTimeout(this._startDrawCycle.bind(this), 20);
    }
  };

  /* API */

  SiriWave.prototype.start = function() {
    this.phase = 0;
    this.run = true;
    this._startDrawCycle();
  };

  SiriWave.prototype.stop = function() {
    this.phase = 0;
    this.run = false;
  };

  SiriWave.prototype.setSpeed = function(v, increment) {
    this._interpolation.speed = v;
  };

  SiriWave.prototype.setNoise = SiriWave.prototype.setAmplitude = function(v) {
    this._interpolation.amplitude = Math.max(Math.min(v, 1), 0);
  };

  // Signal canvas interaction
  var signal = document.getElementById('signal-wave');
  var signalWave = new SiriWave({
    container: signal,
    width: signal.clientWidth,
    height: document.getElementById('signal-text').clientHeight,
    speed: 0.02,
    color: '#FD746C',
    frequency: 4,
    amplitude: 0.5,
    autostart: true
  });

  var width = $(window).width();

  window.addEventListener(
    'resize',
    function resize() {
      const newWidth = $(window).width();
      if (newWidth === width) {
        return;
      }

      signalWave.stop();
      signalWave = new SiriWave({
        container: signal,
        width: signal.clientWidth,
        height: document.getElementById('signal-text').clientHeight,
        speed: 0.02,
        color: '#FD746C',
        frequency: 4,
        amplitude: 0.5,
        autostart: true
      });

      width = newWidth;
    },
    false
  );

  window.onload = function() {
    var skill = document.getElementById('skill');
    document.getElementById('code-skill').onclick = function() {
      skill.classList.add('show-code-description');
    };

    document.getElementById('design-skill').onclick = function() {
      skill.classList.add('show-design-description');
    };

    document.getElementById('prototype-skill').onclick = function() {
      skill.classList.add('show-prototype-description');
    };

    document.getElementById('skill-back').onclick = function() {
      skill.classList.remove('show-code-description', 'show-design-description', 'show-prototype-description');
    };

    $('.menu-button').click(function() {
      $('#nav').toggleClass('open');
    });

    // jQuery smooth scroll on link click
    var mainNavHeight = $('#nav').outerHeight();
    var topOffset = 20;
    var windowWidth = $(window).width();
    var lastScrollTop;

    if (windowWidth > 600) {
      topOffset += mainNavHeight;
    } else {
      lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      $(window).on('scroll', bottomNavScroll);
    }

    var $anchorLinks = $('a[href*="#"]:not([href="#"])');
    $anchorLinks.click(function() {
      if (location.pathname.replace(/^\//, '') === this.pathname.replace(/^\//, '') || location.hostname === this.hostname) {
        $('#nav').removeClass('open');
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');

        if (target.length) {
          $('html,body').animate({ scrollTop: target.offset().top - topOffset }, 300);
          return false;
        }
      }
    });

    // Scroll to top when click on logo
    $('a.home').click(function(e) {
      e.preventDefault();
      $('html,body').animate({ scrollTop: 0 }, 500);
    });

    // Activate link on scroll
    var $link = $('.link');
    var $window = $(window);
    var positions = [];

    function getPositions() {
      for (var i = 0; i < $link.length; i++) {
        positions[i] = $link.eq(i).offset().top;
      }
    }

    function scrollFunc() {
      var scrollTop = $(this).scrollTop() + topOffset + 10;

      $anchorLinks.removeClass('active');
      $anchorLinks.eq(0).addClass('active');

      for (var i = $link.length - 1; i > 0; i--) {
        if (scrollTop > positions[i]) {
          $anchorLinks.removeClass('active');
          $anchorLinks.eq(i).addClass('active');
          return;
        }
      }
    }

    function bottomNavScroll() {
      var currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;

      if (currentScrollTop > lastScrollTop) {
        // downscroll
        $('#nav .links').addClass('hide');
      } else {
        // upscroll
        $('#nav .links').removeClass('hide');
      }

      lastScrollTop = currentScrollTop <= 0 ? 0 : currentScrollTop; // For Mobile or negative scrolling
    }

    getPositions();
    $window.on('scroll', scrollFunc);

    $window.resize(function() {
      if ($window.width() <= 600) {
        topOffset = 20;
        lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      } else {
        topOffset = 20 + mainNavHeight;
      }

      getPositions();
      $window.on('scroll', scrollFunc);
    });
  };
})();
