// variabili globali
let data; 
let minLat, minLon, maxLat, maxLon;
let minElev, maxElev; 
let legendaWidth; 
let selectedTypes = ['All']; // array per la selezione multipla dei tipi di vulcano

// variabili per l'hover e il clic
let hoveredVolcano = null; // nome del vulcano per l'etichetta
let hoveredVolcanoIndex = -1; // indice di riga univoco per il clic e l'highlight
let hoveredVolcanoInfo = { x: 0, y: 0, name: null };

// definisco l'ordine dei tipi di vulcano per la legenda
const LEGEND_TYPES = [
    'All',
    'Stratovolcano',
    'Volcanic field',
    'Caldera', 
    'Shield volcano',
    'Complex volcano', 
    'Lava dome',    
    'Submarine volcano',
    'Maars',
    'Cinder cone',
    'Fissure vent',
    'Other'
];

// carico il dataset, tenendo conto dell'header
function preload() {
  data = loadTable("assets/data.csv", "csv", "header");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  
  let allLat = data.getColumn("Latitude");
  minLat = min(allLat);
  maxLat = max(allLat);

  let allLon = data.getColumn("Longitude");
  minLon = min(allLon);
  maxLon = max(allLon);

  let allElev = data.getColumn("Elevation");
  minElev = min(allElev); 
  maxElev = max(allElev); 
}

function draw() {
  background(20);

  const LEFT_MAP_START_X = 30; // margine sinistro per i gradi Latitudine
  const MAP_BOTTOM_Y = height - 65; // margine inferiore sollevato
  
  let mapWidthTotal = width * 0.8; 
  let mapWidthArea = mapWidthTotal - LEFT_MAP_START_X; // area disponibile per la mappa

  // titolo
  let titleText = "VOLCANOES"; 
  let targetTextSize = 1;
  let targetTextWidth = 0; 
  while (targetTextWidth < mapWidthArea * 0.95) { 
      targetTextSize += 1;  
      textSize(targetTextSize);
      targetTextWidth = textWidth(titleText);
  }
  targetTextSize -= 1; 
  
  let titleHeightPx = targetTextSize + 30; 
  let titleBaselineY = 15 + targetTextSize;

  fill(255); 
  textAlign(LEFT, TOP);
  textSize(targetTextSize); 
  textStyle(BOLD);
  text(titleText, LEFT_MAP_START_X, 15); 

  // l'altezza della mappa inizia dopo il titolo
  let mapStartHeight = titleHeightPx; 

    // disegna legenda
  drawLegenda(titleBaselineY);

  // disegna griglia
  drawGrid(mapStartHeight, LEFT_MAP_START_X, mapWidthArea, MAP_BOTTOM_Y);

  // disegna glifi
  drawVulcano(mapStartHeight, LEFT_MAP_START_X, mapWidthArea, MAP_BOTTOM_Y);
  
    // coordinate latitudine e longitudine sotto la mappa
  if (mouseX > LEFT_MAP_START_X && mouseX < mapWidthArea && 
      mouseY > mapStartHeight && mouseY < MAP_BOTTOM_Y) {
    
    let mouseLon = map(mouseX, LEFT_MAP_START_X, mapWidthArea, minLon, maxLon);
    let mouseLat = map(mouseY, MAP_BOTTOM_Y, mapStartHeight, minLat, maxLat);
    drawCoordinatesUnderMap(mouseLat, mouseLon, LEFT_MAP_START_X);
  } else {
    drawCoordinatesUnderMap(null, null, LEFT_MAP_START_X); 
  }
}

// funzione per disegnare la legenda
function drawLegenda(titleBaselineY) {
  legendaWidth = width * 0.2; 
  let legendaX = width - legendaWidth; 
  const elementHeight = 45; 
  const sampleSize = 28; 
  const margin = 10; 
  const LEFT_X_MARGIN = legendaX + margin; 

  // sfondo 
  fill(30);
  noStroke();
  rect(legendaX, 0, legendaWidth, height); 
  
  // titolo
  push();
  fill(255);
  
  // sottotitolo
  let subTitleSize = legendaWidth * 0.15; 
  if (subTitleSize < 10) subTitleSize = 10; 
  let startY = titleBaselineY - (subTitleSize * 2);
  if (startY < 20) {
      startY = 20; 
      subTitleSize = (titleBaselineY - 20) / 2.2;
  }
  
  textSize(subTitleSize); 
  textAlign(LEFT, BOTTOM); 
  textStyle(NORMAL);
  text("of the", LEFT_X_MARGIN, startY); 
  let currentY = startY + subTitleSize * 1.5; 
  
  textSize(subTitleSize*1.5);
  textStyle(BOLD); 
  text("WORLD", LEFT_X_MARGIN, currentY); 
  currentY += subTitleSize * 1.0; 
  pop();
  
  let itemY = currentY + 5; 
  let legendCenterX = legendaX + legendaWidth / 2;
  
  for (let i = 0; i < LEGEND_TYPES.length; i++) {
    const itemType = LEGEND_TYPES[i];
    const itemColor = getVolcanoCategory(itemType).color;
    let itemCenterY = itemY + elementHeight / 2; 

    // disegno lo sfondo se il tipo è selezionato
    if (selectedTypes.includes(itemType)) {
        fill(70); 
        rect(legendaX, itemY, legendaWidth, elementHeight);
    }
    
    // disegno glifi e testi
    if (itemType !== 'All') {
        fill(itemColor);
        let triX = legendaX + (legendaWidth * 0.18); 
        let triY = itemCenterY;

        triangle(
            triX, triY - sampleSize / 2, 
            triX - sampleSize / 2, triY + sampleSize / 2, 
            triX + sampleSize / 2, triY + sampleSize / 2  
        );
        
        textAlign(LEFT, CENTER); 
        fill(255);
        textSize(legendaWidth * 0.075); 
        textStyle(NORMAL);
        text(itemType, legendaX + (legendaWidth * 0.3), itemCenterY); 
    } else {
        textAlign(CENTER, CENTER);
        fill(255);
        textSize(legendaWidth * 0.085); 
        textStyle(BOLD);
        text(itemType, legendCenterX, itemCenterY); 
    } 
    itemY += elementHeight; 
  }
}

// gestione del clic del mouse per il filtro multi-selezione 
function mouseClicked() {
  legendaWidth = width * 0.25;   
  let legendaX = width - legendaWidth; 
  const elementHeight = 45; 
  
  // calcolo della Y iniziale
  let mapWidthTotal = width * 0.75; 
  let LEFT_MAP_START_X = 30;
  let mapWidthArea = mapWidthTotal - LEFT_MAP_START_X;
  let titleText = "VOLCANOES"; 
  let targetTextSize = 1;
  let targetTextWidth = 0;
  while (targetTextWidth < mapWidthArea * 0.95) { 
      targetTextSize += 1;  
      textSize(targetTextSize);
      targetTextWidth = textWidth(titleText);
  }
  targetTextSize -= 1; 
  let titleBaselineY = 15 + targetTextSize; 
  
  let subTitleSize = legendaWidth * 0.15; 
  if (subTitleSize < 10) subTitleSize = 10;
  
  let Y_start = titleBaselineY - (subTitleSize * 2);

  if (Y_start < 20) { 
      Y_start = 20;
      subTitleSize = (titleBaselineY - 20) / 2.2;
  }

  let currentY = Y_start;
  currentY += subTitleSize * 1.5; 
  currentY += subTitleSize * 1.0; 
  currentY += 10; 

  const Y_TOP_FIRST_ITEM = currentY + 5; 
  
  // controllo se il clic è all'interno della colonna della legenda
  if (mouseX > legendaX) {
    let clickedType = null;
    let indexClicked = floor((mouseY - Y_TOP_FIRST_ITEM) / elementHeight);
    
    if (indexClicked >= 0 && indexClicked < LEGEND_TYPES.length) {
        clickedType = LEGEND_TYPES[indexClicked];
    }
    
    if (clickedType !== null) {
      if (clickedType === 'All') {
        selectedTypes = ['All'];
      } else {
        selectedTypes = selectedTypes.filter(t => t !== 'All');

        const indexInSelection = selectedTypes.indexOf(clickedType);
        if (indexInSelection > -1) {
          selectedTypes.splice(indexInSelection, 1);
        } else {
          selectedTypes.push(clickedType);
        }
        
        if (selectedTypes.length === 0) {
          selectedTypes.push('All');
        }
      }
    }
  }
}

// disegno la griglia (mappa)
function drawGrid(titleHeight, mapStartX, mapEndX, mapBottomY) {
  
  let lonStep = 30; 
  for (let lon = Math.ceil(minLon / lonStep) * lonStep; lon <= maxLon; lon += lonStep) {
    let x = map(lon, minLon, maxLon, mapStartX, mapEndX); 
    stroke(50);
    strokeWeight(1);
    line(x, titleHeight, x, mapBottomY);
    
    fill(150);
    noStroke();
    textSize(10);
    textAlign(CENTER, TOP);
    text(lon + "°", x, mapBottomY + 5); 
  }

  let latStep = 30; 
  for (let lat = Math.ceil(minLat / latStep) * latStep; lat <= maxLat; lat += latStep) {
    let y = map(lat, minLat, maxLat, mapBottomY, titleHeight);
    stroke(50);
    strokeWeight(1);
    line(mapStartX, y, mapEndX, y);
    
    fill(150);
    noStroke();
    textSize(10);
    textAlign(RIGHT, CENTER);
    text(lat + "°", mapStartX - 5, y); 
  }
}

// visualizza le coordinate sotto la mappa
function drawCoordinatesUnderMap(lat, lon, mapStartX) {
    push(); 
    
    let mapWidthTotal = width * 0.8; 
    let mapContentWidth = mapWidthTotal - mapStartX;
    
    fill(255); 
    textSize(mapContentWidth * 0.02); 
    textStyle(NORMAL);
    textAlign(LEFT, BOTTOM); 

    let latText = lat !== null ? lat.toFixed(2) : '--';
    let lonText = lon !== null ? lon.toFixed(2) : '--';
    
    let coordinateString = `LATITUDE: ${latText} ° | LONGITUDE: ${lonText} °`;
    text(coordinateString, mapStartX, height - 15); 
    pop();
}

// disegno un glifo per ogni riga del dataset
function drawVulcano(titleHeight, mapStartX, mapEndX, mapBottomY){
  let size = 16; 
  
  // resetta lo stato di hover
  hoveredVolcanoIndex = -1; 
  hoveredVolcanoInfo.name = null; 
  hoveredVolcano = null; 

  // 1. identidicazione dell'indice univoco hoverato
  let min_d = size; 
  for(let rowNumber = 0; rowNumber < data.getRowCount(); rowNumber++){
    let lon = data.getNum(rowNumber, "Longitude");
    let lat = data.getNum(rowNumber, "Latitude");
    let name = data.getString(rowNumber, "VolcanoName")
    let type = data.getString(rowNumber, "Type");
    
    let volcanoData = getVolcanoCategory(type);
    let volcanoCategory = volcanoData.name; 

    // --- condizione di filtro ---
    let shouldCheck = selectedTypes.includes('All') || selectedTypes.includes(volcanoCategory);
    
    if (!shouldCheck) {
      continue; 
    }

    // Mappatura aggiornata con i nuovi margini
    let x = map(lon, minLon, maxLon, mapStartX, mapEndX);
    let y = map(lat, minLat, maxLat, mapBottomY, titleHeight);
    
    let d = dist(x, y, mouseX, mouseY);
    
    // Se è più vicino della distanza minima attuale E sotto la soglia di interazione
    if(d < min_d && d < size/2){ 
      min_d = d;
      hoveredVolcanoIndex = rowNumber; 
      hoveredVolcano = name; 
      // salva le informazioni necessarie per punto 3
      hoveredVolcanoInfo.x = x;
      hoveredVolcanoInfo.y = y;
      hoveredVolcanoInfo.name = name;
    }
  }

  // 2. disegna i glifi
  for(let rowNumber = 0; rowNumber < data.getRowCount(); rowNumber++){
    let lon = data.getNum(rowNumber, "Longitude");
    let lat = data.getNum(rowNumber, "Latitude");
    let type = data.getString(rowNumber, "Type");
    
    let volcanoData = getVolcanoCategory(type);
    let volcanoCategory = volcanoData.name; 
    let volcanoColor = volcanoData.color;

    // condizione di filtro
    let shouldDraw = selectedTypes.includes('All') || selectedTypes.includes(volcanoCategory);
    
    if (!shouldDraw) {
      continue; 
    }

    // mappatura
    let x = map(lon, minLon, maxLon, mapStartX, mapEndX);
    let y = map(lat, minLat, maxLat, mapBottomY, titleHeight);
    
    // calcolo dei vertici del triangolo (glifo)
    let x1 = x;               
    let y1 = y - size / 2;    
    let x2 = x - size / 2;    
    let y2 = y + size / 2;    
    let x3 = x + size / 2;    
    let y3 = y + size / 2;    

    // controllo se l'indice di riga corrente è quello hoverato
    if(rowNumber === hoveredVolcanoIndex){ 
      stroke("white");
      strokeWeight(1.5);
    } else {
      noStroke();
    }

    fill(volcanoColor);
    triangle(x1, y1, x2, y2, x3, y3); 
  }

  // 3. disegna etichetta
  if(hoveredVolcanoIndex !== -1){
      
      // calcola la larghezza del testo
      let padding = 8;
      let textSizeValue = 16; 
      textSize(textSizeValue);
      textAlign(LEFT, CENTER); 
      textStyle(NORMAL);
      
      let textWidthValue = textWidth(hoveredVolcanoInfo.name);
      
      // calcoli per il box di sfondo
      let boxW = textWidthValue + 2 * padding; 
      let boxH = textSizeValue + 2 * padding; 
      let cornerRadius = 15;  
      let boxX = hoveredVolcanoInfo.x + 10;
      let boxY = hoveredVolcanoInfo.y - boxH / 2; 
      
      // 1. disegna il box di sfondo
      noStroke();
      fill(50, 50, 50, 200); 
      rect(boxX, boxY, boxW, boxH, cornerRadius);
      
      // 2. disegna il testo (sopra il box)
      fill("white");
      let textX = boxX + padding;
      let textY = hoveredVolcanoInfo.y; 
      
      text(hoveredVolcanoInfo.name, textX, textY); 
  }
  
  textStyle(NORMAL);
}

// mapping che associa ogni tipo di vulcano a una categoria e un colore
function getVolcanoCategory(type) {
  const normalizedType = type.trim().toLowerCase(); 
  let categoryName = 'Other';
  let categoryColor = color(129, 129, 129); // colore default 'Other'

  // mappatura basata sulle categorie della legenda
  if (normalizedType.includes('stratovolcano')) { 
      categoryName = 'Stratovolcano';
      categoryColor = color("#490C22");        
    } else if (normalizedType.includes('volcanic field')) {
      categoryName = 'Volcanic field';
      categoryColor = color("#6A040F");        
    } else if (normalizedType.includes('caldera')) {
      categoryName = 'Caldera';
      categoryColor = color("#D00000");        
    } else if (normalizedType.includes('shield')) {
      categoryName = 'Shield volcano';
      categoryColor = color("#E85D04");        
    } else if (normalizedType.includes('complex')) {
      categoryName = 'Complex volcano';
      categoryColor = color("#F48C06");       
    } else if (normalizedType.includes('lava dome')) {
      categoryName = 'Lava dome';
      categoryColor = color("#FFBA08");       
    } else if (normalizedType.includes('submarine')) {
      categoryName = 'Submarine volcano';
      categoryColor = color("#2A4D88");         
    } else if (normalizedType.includes('maar')) {
      categoryName = 'Maars';
      categoryColor = color("#7C94B8");         
    } else if (normalizedType.includes('cinder cone')) {
      categoryName = 'Cinder cone';
      categoryColor = color("#A0522D");        
    } else if (normalizedType.includes('fissure') || normalizedType.includes('vent')) {
      categoryName = 'Fissure vent';
      categoryColor = color("#FABC7F");       
    }
  
  return { name: categoryName, color: categoryColor };
}

// cliccando un vulcano si apre la sua pagina specifica
function mousePressed(){
  if (hoveredVolcanoIndex !== -1) {
      let myUrl = "detail.html?RowIndex=" + hoveredVolcanoIndex; 
      window.location.href = myUrl;
  }
}