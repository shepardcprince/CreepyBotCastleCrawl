var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 500},
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

var game = new Phaser.Game(config);

var map;
var player;
var cursors;
var skyLayer, worldLayer, leverLayer, treasureLayer, accentsLayer, behindLayer;
var text;
var score = 0;
var inverted = false;

function preload() {
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/CastleMap.json');
    // tiles in spritesheet 
    this.load.spritesheet('Gothic_Castle_Tileset', 'assets/Gothic_Castle_Tileset.png', {frameWidth: 16, frameHeight: 16});
    // player animations
    this.load.atlas('player', 'assets/player.png', 'assets/player.json');
    //star--will be lever
    this.load.image('lever', 'assets/star.png');
    // Sky background    
    this.load.image('Sky', 'assets/sky.png')
}

function create() {
    // load the map 
    map = this.make.tilemap({key: 'map'});
    
    this.cameras.main.zoom = 1;
    
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
    // add treasure as tiles
    treasureLayer = map.createDynamicLayer('Treasure', treasureTiles, 0, 0);
    
    
    // set the boundaries of our game world
    this.physics.world.bounds.width = worldLayer.width;
    this.physics.world.bounds.height = worldLayer.height;

    // create the player sprite    
    player = this.physics.add.sprite(0, 600, 'player').setScale(.5);
    player.body.gravity.y = 500;    
    player.inverted = false;
    player.setBounce(0.2); // our player will bounce from items
    player.setCollideWorldBounds(true); // don't go out of the map    
    
    // small fix to our player images, we resize the physics body object slightly
    player.body.setSize(player.width, player.height);
    
    // player will collide with the level tiles 
    this.physics.add.collider(worldLayer, player);

    treasureLayer.setTileIndexCallback(153, collectTreasure, this);
    // when the player overlaps with a tile with index 152, collectTreasure 
    // will be called    
    this.physics.add.overlap(player, treasureLayer);

    // player walk animation
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 1, end: 11, zeroPad: 2}),
        frameRate: 10,
        repeat: -1
    });
    // idle with only one frame, so repeat is not neaded
    this.anims.create({
        key: 'idle',
        frames: [{key: 'player', frame: 'p1_stand'}],
        frameRate: 10,
    });


    cursors = this.input.keyboard.createCursorKeys();

    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(player);

    // set background color, so the sky is not black    
    this.cameras.main.setBackgroundColor('#ccccff');

    // this text will show the score
    text = this.add.text(20, 570, '0', {
        fontSize: '20px',
        fill: '#ffffff'
    });
    // fix the text to the camera
    text.setScrollFactor(0);
    
   //star added, will be lever  
    lever = this.physics.add.image(250, 400, 'lever');
    lever1 = this.physics.add.image(350, 250, 'lever');
    lever1.body.allowGravity = false;
    lever.setCollideWorldBounds(true); // don't go out of the map
    // lever will collide with the level tiles 
    this.physics.add.collider(worldLayer, lever);
    this.physics.add.overlap(player, lever, flipLever, null, this);
    this.physics.add.overlap(player, lever1, flipLever, null, this);
}

// this function will be called when the player touches a treasure chest
function collectTreasure(sprite, tile) {
    treasureLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    score++; // add 10 points to the score
    text.setText(score); // set the text to show the current score
    return false;
}


function flipLever(player, lever) {
        if (this.time.now - this.fliptime < 1000)
            {return;}
    
        inverseGravity();
        this.fliptime = this.time.now;
  
}

function update(time, delta) {
    //for regular play (not inverted)
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
        player.body.setVelocityY(-500);        
    }
    
    //for inverted play
       if (cursors.left.isDown && player.inverted)
    {
        player.body.setVelocityX(-200);
        player.anims.play('walk', true); // walk left
        player.flipX = false; // flip the sprite to the left
    }
    else if (cursors.right.isDown && player.inverted)
    {
        player.body.setVelocityX(200);
        player.anims.play('walk', true);
        player.flipX = true; // use the original sprite looking to the right
    } 
   
    if (cursors.down.isDown && player.inverted && player.body.blocked.up)
    {
        player.body.setVelocityY(500);  
        
    }
    
        
}

function inverseGravity() 
{    
    if (player.inverted === false) 
    {        
        player.angle = -180;        
        player.body.gravity.y = -1500;        
        player.inverted = true;    
    } 
    else if (player.inverted ===true)
    {        
        player.angle = 0;        
        player.body.gravity.y = 500;        
        player.inverted = false;    
    }
}
