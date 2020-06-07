var gameWidth = 500;
var gameHeight = 300;


var config = {
    type: Phaser.AUTO,
    width: gameWidth,
    height: gameHeight,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 0},
            debug: false
        }
    },
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    },
    pixelArt: true
    
};

var loadingText;
var map;
var player;
var cursors;
var escKey;
var skyLayer, worldLayer, leverLayer, treasureLayer, accentsLayer, behindLayer, spikesLayer;
var text;
var score = 0;
var inverted = false;
var game;
var winText;

window.onload = function() {
  game = new Phaser.Game(config);
  resize();
  window.addEventListener("resize", resize, false);
};

function resize() {
  var canvas = document.querySelector("canvas");
  var windowWidth = window.innerWidth;
  var windowHeight = window.innerHeight;
  var windowRatio = windowWidth / windowHeight;
  var gameRatio = game.config.width / game.config.height;
  if (windowRatio < gameRatio) {
    canvas.style.width = windowWidth + "px";
    canvas.style.height = (windowWidth / gameRatio) + "px";
  } else {
    canvas.style.width = (windowHeight * gameRatio) + "px";
    canvas.style.height = windowHeight + "px";
  }
}



function preload() {
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/CastleMap.json');
    // tiles in spritesheet 
    this.load.spritesheet('Gothic_Castle_Tileset', 'assets/Gothic_Castle_Tileset.png', {frameWidth: 16, frameHeight: 16});
    // player animations
    this.load.spritesheet('player', 'assets/robot.png', {frameWidth: 17, frameHeight: 32});
    //star--will be lever
    this.load.image('lever', 'assets/star.png');
    // Sky background    
    this.load.image('Sky', 'assets/sky.png');
}

function create() {
    
    
    // load the map 
    map = this.make.tilemap({key: 'map'});
    
    // Sky background tiles
    var skyTiles = map.addTilesetImage('Sky');
    // SKy background layer
    skyLayer = map.createDynamicLayer('Sky', skyTiles, 0, 0);
    
    // Background artifacts tiles
    var behindTiles = map.addTilesetImage('Gothic_Castle_Tileset');
    // Background artifacts layer
    behindLayer = map.createDynamicLayer('Behind', behindTiles, 0, 0);
    
    // Background accents tiles
    var accentsTiles = map.addTilesetImage('Gothic_Castle_Tileset');
    // Background Accents layer
    accentsLayer = map.createDynamicLayer('BehindAccents', accentsTiles, 0, 0);
    
    // World collision tiles
    var worldTiles = map.addTilesetImage('Gothic_Castle_Tileset');
    // create the world layer
    worldLayer =    map.createDynamicLayer('World', worldTiles, 0, 0);
    // the player will collide with this layer
    worldLayer.setCollisionByExclusion([-1]);

    // treasure image used as tileset
    var treasureTiles = map.addTilesetImage('Gothic_Castle_Tileset');
    // add treasure as layers
    treasureLayer = map.createDynamicLayer('Treasure', treasureTiles, 0, 0);
    
    // Lever tileset image
    var leverTiles = map.addTilesetImage('Gothic_Castle_Tileset');
    // add levers as layers
    leverLayer = map.createDynamicLayer('Levers', leverTiles, 0, 0,);
    
    // spikes tileset image
    var spikesTiles = map.addTilesetImage('Gothic_Castle_Tileset');
    // add spikes as layers
    spikesLayer = map.createDynamicLayer('Spikes', spikesTiles, 0, 0,);
    
    
    // set the boundaries of our game world
    this.physics.world.bounds.width = worldLayer.width;
    this.physics.world.bounds.height = worldLayer.height;
    
    
        
    //instruction text
    loadingText = this.add.text(9, 767, "Collect all 34 chests. Use the Space bar to 'flip' the switches to explore more.", { font: "20px Arial", fill: "#ff0044", align: "center" });
    this.key = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
   

    // create the player sprite    
    player = this.physics.add.sprite(9, 760, 'player');
    player.body.gravity.y = 2000;    
    player.inverted = false;
    player.setBounce(0.2); // our player will bounce from items
    player.setCollideWorldBounds(true); // don't go out of the map    
    
    // player will collide with the level tiles 
    this.physics.add.collider(worldLayer, player);

    
    // when the player overlaps with a tile with index 152, collectTreasure 
    // will be called    
    treasureLayer.setTileIndexCallback(153, collectTreasure, this);
    this.physics.add.overlap(player, treasureLayer);

    // when the player overlaps with a tile with index 129-132, reset
    // will be called    
    spikesLayer.setTileIndexCallback(129, spikesTrigger, this);
    spikesLayer.setTileIndexCallback(130, spikesTrigger, this);
    spikesLayer.setTileIndexCallback(131, spikesTrigger, this);
    spikesLayer.setTileIndexCallback(132, spikesTrigger, this);
    this.physics.add.overlap(player, spikesLayer);
    
    // player walk animation
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 2, end: 5}),
        frameRate: 10,
        repeat: -1
    });
    // idle with only one frame, so repeat is not neaded
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', {start: 0, end: 1}),
        frameRate: 10,
        repeat: -1,
    });


    // Keybindings
    cursors = this.input.keyboard.createCursorKeys();
    escKey = this.input.keyboard.addKey(27);

    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(player);

    // set background color, so the sky is not black    
    this.cameras.main.setBackgroundColor('#ccccff');

    

    // this text will show the score
    scoreText = this.add.text(315, 5, 'Treasure Chests:', {
        font: 'bold 14pt Arial',
        //fontSize: '14px',
        fill: '#FFFF00'
    });
    // fix the text to the camera
    scoreText.setScrollFactor(0);
    scoreText.setShadow(1,1,'#000000',1);
    

    // check for collision with lever tiles and call flipLever 
    leverLayer.setTileIndexCallback(166, flipLever, this);
    this.physics.add.overlap(player, leverLayer);
    
    
}

// this function will be called when the player touches a treasure chest
function collectTreasure(sprite, tile) {
    treasureLayer.removeTileAt(tile.x, tile.y); // remove the treasure chest
    score++; // add 10 points to the score
    
    if (score == 34)
    {
            var winTextStyle = { font: 'bold 20pt Arial', fill: 'green', align: 'center', wordWrap: { width: 125, useAdvancedWrap: true } };

            winText = this.add.text(200, 100, "You WIN! Press F5 to reset.", winTextStyle);
            // fix the text to the camera
            winText.setScrollFactor(0);
            winText.setShadow(1,1,'#000000',1);
    
            this.scene.pause();
            return;
    }
    else
    scoreText.setText('Treasure Chests:' + score); // set the text to show the current score
    return false;
}
 //function to remove text
function removeText() {
    loadingText.destroy();
}

//flips the player when they touch the lever
function flipLever(player, lever) {
        if (this.time.now - this.fliptime < 200)
            {return;}
        if (cursors.space.isDown)
            {
                inverseGravity();
            }
        this.fliptime = this.time.now;
  
}

function update(time, delta) {
    //for regular play (not inverted) movement
    if (cursors.left.isDown)
    {
        player.body.setVelocityX(-200);
        player.anims.play('walk', true); // walk left
        player.flipX = true; // flip the sprite to the left
    }
    else if (cursors.right.isDown)
    {
        player.body.setVelocityX(200);
        player.anims.play('walk', true);
        player.flipX = false; // use the original sprite looking to the right
    } else {
        player.body.setVelocityX(0);
        player.anims.play('idle', true);
    }
    // jump 
    if (cursors.up.isDown && player.body.onFloor() && !player.inverted)
    {
        player.body.setVelocityY(-550);        
    }
    
    //for inverted play movement
       if (cursors.left.isDown && player.inverted)
    {
        player.body.setVelocityX(-200);
        player.anims.play('walk', true); 
        player.flipX = false; // flip the sprite to the right
    }
    else if (cursors.right.isDown && player.inverted)
    {
        player.body.setVelocityX(200);
        player.anims.play('walk', true);
        player.flipX = true; // use the original sprite looking to the left
    } 
   
    if (cursors.down.isDown && player.inverted && player.body.blocked.up)
    {
        player.body.setVelocityY(550);  
        
    }
    
    if (this.key.isDown && loadingText ===true) {
     removeText();
  }
        
}

//inverts the gravity depending on current state of player
function inverseGravity() 
{    
    if (player.inverted === false) 
    {        
        player.angle = -180;        
        player.body.gravity.y = -2000;        
        player.inverted = true;    
    } 
    else if (player.inverted ===true)
    {        
        player.angle = 0;        
        player.body.gravity.y = 2000;        
        player.inverted = false;    
    }
}


// Triggers restart screen upon touching spike
function spikesTrigger()
{
    var endTextStyle = { font: 'bold 14pt Arial', fill: 'red', align: 'center', wordWrap: { width: 125, useAdvancedWrap: true } };

    endText = this.add.text(200, 100, "You've been hit! Press F5 to reset.", endTextStyle);
    // fix the text to the camera
    endText.setScrollFactor(0);
    endText.setShadow(1,1,'#000000',1);
    
    this.scene.pause();
    return;
}


