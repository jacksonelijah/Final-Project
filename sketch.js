let imageLibrary = [];
// array to store cutouts
let collageElements = [];
let selectedElement = null;
let canvasBackground = 220;
let backgroundMusic;
let musicMuted = false;

//loading....
function preload() {
  imageLibrary = [
    loadImage("assets/image1.jpg"),
    loadImage("assets/image2.jpg"),
    loadImage("assets/image3.jpg"),
    loadImage("assets/image4.jpg"),
    loadImage("assets/image5.jpg"),
    loadImage("assets/image6.jpg"),
    loadImage("assets/image7.jpg"),
    loadImage("assets/image8.jpg"),
  ];
  //cute little song i made (add volume knob?)
  backgroundMusic = loadSound("assets/music.mp3");
}

function setup() {
  createCanvas(800, 600).parent("canvas-container");

  //play background music on loop
  if (backgroundMusic) {
    backgroundMusic.loop();
  }

  setupInterface();
}

function draw() {
  background(canvasBackground);

  //display  collage elements
  collageElements.forEach((element) => {
    element.display();
  });

  //show resize box thing if an element is selected
  if (selectedElement) {
    selectedElement.displayResizeBox();
  }
}

function setupInterface() {
  //dropdown for selcting images
  const imageDropdown = createSelect();
  styleUIElement(imageDropdown, 10, 10);
  imageLibrary.forEach((img, index) => {
    imageDropdown.option(`Image ${index + 1}`, index);
  });

  //buttons for different interactions
  createUIButton("Add Image", 10, 50, () => {
    const selectedIndex = imageDropdown.value();
    addNewCollageElement(imageLibrary[selectedIndex]);
  });

  createUIButton("Randomize Shape", 10, 90, () => {
    if (selectedElement) {
      selectedElement.generateRandomShape();
    }
  });

  createUIButton("Apply Color Filter", 10, 130, () => {
    if (selectedElement) {
      selectedElement.applyRandomColorFilter();
    }
  });

  createUIButton("Change Background", 10, 170, () => {
    canvasBackground = color(random(255), random(255), random(255));
  });

  createUIButton("Delete Selected", 10, 210, () => {
    if (selectedElement) {
      collageElements = collageElements.filter(
        (elem) => elem !== selectedElement
      );
      selectedElement = null;
    }
  });
  //mute feature
  createUIButton("Mute Music", 10, 250, () => {
    if (!musicMuted && backgroundMusic.isPlaying()) {
      backgroundMusic.pause();
      musicMuted = true;
    }
  });

  createUIButton("Unmute Music", 10, 290, () => {
    if (musicMuted) {
      backgroundMusic.loop();
      musicMuted = false;
    }
  });


  preventDeselectionOnUIInteraction();
}
//insert pic randomly
function addNewCollageElement(img) {
  const randomX = random(100, width - 100);
  const randomY = random(100, height - 100);
  collageElements.push(new CollageElement(img, randomX, randomY));
}

//classfor collage elecments
class CollageElement {
  constructor(image, posX, posY) {
    this.image = image;
    this.x = posX;
    this.y = posY;
    this.width = 150;
    this.height = 150;
    this.isBeingDragged = false;
    this.resizeActive = false;
    this.offsetX = 0;
    this.offsetY = 0;
    this.colorOverlay = null;
    this.maskedImage = null;
    this.shapeGraphics = null;
    this.resizeHandleSize = 10;
  }

  display() {
    if (this.colorOverlay) {
      push();
      tint(this.colorOverlay);
    }
    //mask allows for image to chnge shape
    if (this.maskedImage) {
      image(this.maskedImage, this.x, this.y, this.width, this.height);
    } else {
      image(this.image, this.x, this.y, this.width, this.height);
    }
    if (this.colorOverlay) {
      pop();
    }
  }
  //create graphics makes an off screen canvas to make the shape of the new collage piece (add begin and end shape)
  generateRandomShape() {
    this.shapeGraphics = createGraphics(this.width, this.height);
    this.shapeGraphics.fill(255);
    this.shapeGraphics.noStroke();
    this.shapeGraphics.beginShape();
    const points = int(random(3, 7));
    for (let i = 0; i < points; i++) {
      const angle = TWO_PI * (i / points);
      const randomX = random(this.width / 4, this.width / 2);
      const randomY = random(this.height / 4, this.height / 2);
      this.shapeGraphics.vertex(
        this.width / 2 + cos(angle) * randomX,
        this.height / 2 + sin(angle) * randomY
      );
    }
    this.shapeGraphics.endShape(CLOSE);

    this.maskedImage = this.image.get();
    this.maskedImage.resize(this.width, this.height);
    this.maskedImage.mask(this.shapeGraphics);
  }

  applyRandomColorFilter() {
    this.colorOverlay = color(random(255), random(255), random(255));
  }

  displayResizeBox() {
    noFill();
    stroke(0, 0, 255);
    strokeWeight(2);
    rect(this.x, this.y, this.width, this.height);
    fill(0, 0, 255);
    noStroke();
    ellipse(
      this.x + this.width,
      this.y + this.height,
      this.resizeHandleSize * 2
    );
  }

  drag() {
    if (this.isBeingDragged) {
      this.x = mouseX + this.offsetX;
      this.y = mouseY + this.offsetY;
    }
  }

  resize() {
    if (this.resizeActive) {
      this.width = max(50, mouseX - this.x);
      this.height = max(50, mouseY - this.y);
    }
  }
//resize interaction 
  handleMousePress() {
    if (this.isMouseOverResizeHandle()) {
      this.resizeActive = true;
      selectedElement = this;
    } else if (this.isMouseOverElement()) {
      this.isBeingDragged = true;
      this.offsetX = this.x - mouseX;
      this.offsetY = this.y - mouseY;
      selectedElement = this;
    }
  }

  handleMouseRelease() {
    this.isBeingDragged = false;
    this.resizeActive = false;
  }

  isMouseOverElement() {
    return (
      mouseX > this.x &&
      mouseX < this.x + this.width &&
      mouseY > this.y &&
      mouseY < this.y + this.height
    );
  }

  isMouseOverResizeHandle() {
    return (
      dist(mouseX, mouseY, this.x + this.width, this.y + this.height) <
      this.resizeHandleSize
    );
  }
}

//makes it so most recent shape gets selected when the different shapes overlap
function mousePressed() {
  let somethingSelected = false;
  for (let i = collageElements.length - 1; i >= 0; i--) {
    if (
      collageElements[i].isMouseOverResizeHandle() ||
      collageElements[i].isMouseOverElement()
    ) {
      collageElements[i].handleMousePress();
      somethingSelected = true;
      break;
    }
  }
  if (!somethingSelected) {
    selectedElement = null;
  }
}

function mouseDragged() {
  if (selectedElement) {
    selectedElement.drag();
    selectedElement.resize();
  }
}

function mouseReleased() {
  if (selectedElement) {
    selectedElement.handleMouseRelease();
  }
}

function createUIButton(label, x, y, onClick) {
  const button = createButton(label);
  styleUIElement(button, x, y);
  button.mousePressed(onClick);
}

function styleUIElement(el, x, y) {
  el.position(x, y);
  el.style("padding", "8px 12px");
  el.style("font-size", "14px");
  el.style("background-color", "#4CAF50");
  el.style("color", "white");
  el.style("border", "none");
  el.style("border-radius", "5px");
  el.style("cursor", "pointer");
  el.style("margin-bottom", "5px");
  //change color of button when hovering
  el.mouseOver(() => el.style("background-color", "#45A049"));
  el.mouseOut(() => el.style("background-color", "#4CAF50"));
  el.elt.addEventListener("mousedown", (e) => e.stopPropagation());
}
  // prevent buttons from deselecting elements
function preventDeselectionOnUIInteraction() {
  const uiElements = selectAll("button, select, input");
  uiElements.forEach((el) => {
    el.elt.addEventListener("mousedown", (e) => e.stopPropagation()); // stopPropagation is to stop the differnet elements from both being selected 
  });
}
