/*jslint bitwise:true, es5: true */
(function (window, undefined) {
    'use strict';
    var KEY_ENTER = 13,
        KEY_LEFT = 37,
        KEY_UP = 38,
        KEY_RIGHT = 39,
        KEY_DOWN = 40,

        canvas = undefined,
        ctx = undefined,
        lastPress = undefined,
        pause = true,
        gameover = true,
        
        dir = 0,
        score = 0,
        // player = undefined,
        body = [],
        food = undefined,
        bonus = undefined,
        // wall = new Array(),
        iBody = new Image(),
        iFood = new Image(),
        iBonus = new Image(),
        aEat = new Audio(),
        aDie = new Audio(),

        lastUpdate = 0,
        FPS = 0,
        frames = 0,
        acumDelta = 0,

        buffer = null,
        bufferCtx = null,

        currentScene = 0,
        scenes = [],
        mainScene = null,
        gameScene = null,
        
        highscores = [],
        posHighscore = 10,
        highscoresScene = null;

    window.requestAnimationFrame = (function () {
        return window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            function (callback) {
                window.setTimeout(callback, 17);
            };
    }());

    document.addEventListener('keydown', function (evt) {
        lastPress = evt.which;
    }, false);

    function Rectangle(x, y, width, height) {
        this.x = (x === undefined) ? 0 : x;
        this.y = (y === undefined) ? 0 : y;
        this.width = (width === undefined) ? 0 : width;
        this.height = (height === undefined) ? this.width : height;
    }
    Rectangle.prototype.intersects = function (rect) {
            if (rect === undefined) {
                window.console.warn('Missing parameters on function intersects');
            } else {
                return (this.x < rect.x + rect.width &&
                    this.x + this.width > rect.x &&
                    this.y < rect.y + rect.height &&
                    this.y + this.height > rect.y);
            }
    };

    Rectangle.prototype.fill = function (ctx) {
            if (ctx === undefined) {
                window.console.warn('Missing parameters on function fill');
            } else {
                ctx.fillRect(this.x, this.y, this.width, this.height);
            }
    };
    Rectangle.prototype.drawImage = function (ctx, img) {
            if (img === undefined) {
                window.console.warn('Missing parameters on function drawImage');
            } else {
                if (img.width) {
                    ctx.drawImage(img, this.x, this.y);
                } else {
                    ctx.strokeRect(this.x, this.y, this.width, this.height);
                }
            }
    };

    function Scene() {
        this.id = scenes.length;
        scenes.push(this);
    }

    Scene.prototype = {
        constructor: Scene,
        load: function () {},
        paint: function (ctx) {},
        act: function () {}
    };

    function loadScene(scene) {
        currentScene = scene.id;
        scenes[currentScene].load();
    }

    function random(max) {
        return Math.floor(Math.random() * max);
    }

    function repaint() {
        window.requestAnimationFrame(repaint);
        if (scenes.length) {
            scenes[currentScene].paint(ctx);
        }
    }

    function run() {
        setTimeout(run,30);
        if (scenes.length) {
            scenes[currentScene].act();
        }

        var now = Date.now(),
            deltaTime = (now - lastUpdate) / 1000;
        if (deltaTime > 1) {
            deltaTime = 0;
        }
        lastUpdate = now;

        frames += 1;
        acumDelta += deltaTime;
        if (acumDelta > 1) {
            FPS = frames;
            frames = 0;
            acumDelta -= 1;
        }  
    }

    function init() {
        // Load saved highscores
        if (localStorage.highscores) {
            highscores = localStorage.highscores.split(',');
        }

        // Get canvas and context
        canvas = document.getElementById('canvas');
        ctx = canvas.getContext('2d');
 
        // Load assets
        iBody.src = 'assets/body.png';
        iFood.src = 'assets/fruit.png';
        iBonus.src = 'assets/lemon.png';
        aEat.src = 'assets/chomp.oga';
        aDie.src = 'assets/dies.oga';

        if (canPlayOgg()) {
            aEat.src= "assets/chomp.oga";
            aDie.src = 'assets/dies.oga';
            } else {
            aEat.src= "assets/chomp.m4a";
            aDie.src = 'assets/dies.m4a';
            }
        
       
        // Create body[0] and food
        body[0] = new Rectangle(40, 40, 10, 10);
        food = new Rectangle(80, 80, 10, 10);
        bonus = new Rectangle(80, 80, 10, 10);

        // Load buffer
        buffer = document.createElement('canvas');
        bufferCtx = buffer.getContext('2d');
        buffer.width = 300;
        buffer.height = 150;

        // Start game
        resize();
        run();
        repaint();

        // Create walls
        // wall.push(new Rectangle(100, 50, 10, 10));
        // wall.push(new Rectangle(100, 100, 10, 10));
        // wall.push(new Rectangle(200, 50, 10, 10));
        // wall.push(new Rectangle(200, 100, 10, 10));
    }

 
    // Main Scene
    mainScene = new Scene();
    
    mainScene.paint = function (ctx) {
        // Clean canvas
        ctx.fillStyle = '#030';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('SNAKE', 150, 60);
        ctx.fillText('Press Enter', 150, 90);
    };

    mainScene.act = function () {
        // Load next scene
        if (lastPress === KEY_ENTER) {
            loadScene(highscoresScene);
            lastPress = null;
        }
    };
    
    gameScene = new Scene();

    //function reset(){
    gameScene.load = function () {
            score = 0;
            dir = 1;
            body[0].x = 40;
            body[0].y = 40;
            food.x = random(canvas.width / 10 - 1) * 10;
            food.y = random(canvas.height / 10 - 1) * 10;
            bonus.x = random(canvas.width / 10 - 1) * 10;
            bonus.y = random(canvas.height / 10 - 1) * 10;
            gameover = false;
            body.length = 0;
            body.push(new Rectangle(40, 40, 10, 10));
            body.push(new Rectangle(0, 0, 10, 10));
            body.push(new Rectangle(0, 0, 10, 10));
    }

    //function paint(ctx){
    gameScene.paint = function (ctx) {
        // Clean canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, buffer.width, buffer.height);

        //FPS count
        ctx.fillStyle = '#fff';
        ctx.fillText('FPS: ' + FPS, 255, 10);


        // Draw food
        ctx.strokeStyle = '#f00';
        food.drawImage(ctx, iFood);

        // Draw bonus
        ctx.strokeStyle = '#f00';
        //bonus.drawImage(ctx, iBonus);
        window.setTimeout(bonus.drawImage(ctx, iBonus), random(300)+5000);
        

        // Debug last key pressed
        ctx.fillStyle = '#fff';

        //ctx.fillText('Last Press: '+lastPress,0,20);
        // Draw score
        ctx.fillText('Score: ' + score, 0, 10);
        
        // Draw pause
        if (pause) {
            ctx.textAlign = 'center';
            if (gameover) {
                ctx.fillText('GAME OVER', 150, 75);
            } else {
                ctx.fillText('PAUSE', 150, 75);
            }
            ctx.textAlign = 'left';
        }

        // Draw walls
        // ctx.fillStyle = '#999';
        // for (i = 0, l = wall.length; i < l; i += 1) {
        //     wall[i].fill(ctx);
        // }

        // Draw score
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + score, 0, 10);

        // Draw player;
        var i,
            l;
        for (i = 0, l = body.length; i < l; i += 1) {
            body[i].drawImage(ctx, iBody);
        }
    }

    //function act(){
    gameScene.act = function () {
        var i,
            l;

        if (!pause) {
            // GameOver Reset
            if (gameover) {
                loadScene(mainScene);
            }
            // Change Direction
            if (lastPress === KEY_UP) {
                dir = 0;
            }
            if (lastPress === KEY_RIGHT) {
                dir = 1;
            }
            if (lastPress === KEY_DOWN) {
                dir = 2;
            }
            if (lastPress === KEY_LEFT) {
                dir = 3;
            }
            // Move Head
            if (dir === 0) {
                body[0].y -= 10;
            }
            if (dir === 1) {
                body[0].x += 10;
            }
            if (dir === 2) {
                body[0].y += 10;
            }
            if (dir === 3) {
                body[0].x -= 10;
            }
            // Out Screen
            if (body[0].x > canvas.width) {
                body[0].x = 0;
            }
            if (body[0].y > canvas.height) {
                body[0].y = 0;
            }
            if (body[0].x < 0) {
                body[0].x = canvas.width;
            }
            if (body[0].y < 0) {
                body[0].y = canvas.height;
            }

            // Food Intersects
            if (body[0].intersects(food)) {
            body.push(new Rectangle(food.x, food.y, 10, 10));
            score += 1;
            food.x = random(canvas.width / 10 - 1) * 10;
            food.y = random(canvas.height / 10 - 1) * 10;
            aEat.play();
            }

            // Bonus Intersects
            if (body[0].intersects(bonus)) {
                score += 3;
                bonus.x = canvas.width+1;
                bonus.y = null;
                setTimeout(function bon () {
                    bonus.x = random(canvas.width / 10 - 1) * 10;
                    bonus.y = random(canvas.height / 10 - 1) * 10;
                }, random(3000)+5000) 
                aEat.play();
            }
           

            // Move Body
            for (i = body.length - 1; i > 0; i -= 1) {
                body[i].x = body[i - 1].x;
                body[i].y = body[i - 1].y;
            }

            // Body Intersects
            for (i = 2, l = body.length; i < l; i += 1) {
                if (body[0].intersects(body[i])) {
                    gameover = true;
                    pause = true;
                    aDie.play();
                    addHighscore(score);
                }
            }

            // Wall Intersects
            // for (i = 0, l = wall.length; i < l; i += 1) {
            //     if (food.intersects(wall[i])) {
            //         food.x = random(canvas.width / 10 - 1) * 10;
            //         food.y = random(canvas.height / 10 - 1) * 10;
            //     }

            //     if (body[0].intersects(wall[i])) {
            //         pause = true;
            //     }

            // }
        }
        
        // Pause/Unpause
        if (lastPress === KEY_ENTER) {
            pause = !pause;
            lastPress = undefined;
        }
    }

    function resize () {
        var w = window.innerWidth / canvas.width;
        var h = window.innerHeight / canvas.height;
        var scale = Math.min(h, w);
        canvas.style.width = (canvas.width * scale) + 'px';
        canvas.style.height = (canvas.height * scale) + 'px';
    }

    function canPlayOgg() {
        var aud = new Audio();
        if (aud.canPlayType('audio/ogg').replace(/no/, '')) {
            return true;
        } else {
            return false;
        }
    }

    function addHighscore(score) {
        posHighscore = 0;
        while (highscores[posHighscore] > score && posHighscore < highscores.length) {
            posHighscore += 1;
        }
        highscores.splice(posHighscore, 0, score);
        if (highscores.length > 10) {
            highscores.length = 10;
        }
        localStorage.highscores = highscores.join(',');
    }

    // Highscore Scene
    highscoresScene = new Scene();

    highscoresScene.paint = function (ctx) {
        var i = 0,
            l = 0;
        // Clean canvas
        ctx.fillStyle = '#030';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('HIGH SCORES', 150, 30);

        // Draw high scores
        ctx.textAlign = 'right';
        for (i = 0, l = highscores.length; i < l; i += 1) {
            if (i === posHighscore) {
                ctx.fillText('*' + highscores[i], 180, 40 + i * 10);
            } else {
                ctx.fillText(highscores[i], 180, 40 + i * 10);
            }
        }
    };

    highscoresScene.act = function () {
        // Load next scene
        if (lastPress === KEY_ENTER) {
            loadScene(gameScene);
            lastPress = null;
        }
    };
        
  
    

    mainScene.load();
    window.addEventListener('resize', resize, false);
    window.addEventListener('load', init, false);

}(window));