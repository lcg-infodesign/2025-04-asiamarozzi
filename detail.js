// variabili globali
let data; 
let backButton; 
let volcanoInfo; 

// elevazione massima e minima per asse y
let maxGlobalElevation = 6979; 
let minGlobalElevation = -6000; 

// carico il dataset, tenendo conto dell'header
function preload() {
  data = loadTable("assets/data.csv", "csv", "header");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(20);
  
  const GRAPH_WIDTH_LIMIT = windowWidth * 0.60; 
  
  // setup bottone
  let buttonX = 20;
  let buttonY = 20;
  let buttonWidth = 100;
  let buttonHeight = 30;
  backButton = {
      x: buttonX,
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
      text: "←  BACK"
  };

  // recupero dati vulcano
  let parameters = getURLParams();
  let rowIndex = parameters.RowIndex; 
  
  if (rowIndex === undefined || rowIndex === null || isNaN(int(rowIndex))) {
    background("red");
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(`Error.`, width/2, height/2);
    return;
  }
  
  let selected = data.getRow(int(rowIndex)); 
  if (!selected) {
    background("red");
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(`Error: volcano not found ${rowIndex}.`, width/2, height/2);
    return;
  }
  
  // estrazione dati
  volcanoInfo = {
      name: selected.getString("VolcanoName"), 
      country: selected.getString("Country"),
      location: selected.getString("Location"),
      elevation: selected.getNum("Elevation"),
      lastEruption: selected.getString("Last Known Eruption"),
      type: selected.getString("Type"),
      typeCategory: selected.getString("TypeCategory"),
      status: selected.getString("Status"), 
      latitude: selected.getNum("Latitude"), 
      longitude: selected.getNum("Longitude"), 
  };
  
  // titoli
  let leftMarginX = 20;
  const CENTER_X = width / 2; 
  const TITLE_SIZE = 80;
  const SUBTITLE_SIZE = 25; 
  let endOfGraphY = 80 + windowHeight * 0.7; 
  let titleSpacing = 20; 
  let titleY = titleSpacing; 
  let subtitleY = titleY + TITLE_SIZE; 

  // nome vulcano
  fill(255);
  textSize(TITLE_SIZE); 
  textAlign(CENTER, TOP); 
  textStyle(BOLD); 
  text(volcanoInfo.name.toUpperCase(), CENTER_X, titleY); 
  // paese e location
  fill(200); 
  textSize(SUBTITLE_SIZE);
  textAlign(CENTER, TOP); 
  textStyle(NORMAL); 
  text(`${volcanoInfo.country} | ${volcanoInfo.location}`, CENTER_X, subtitleY); 
   
  // disegna grafico
  drawElevationTriangleChart(volcanoInfo.elevation, volcanoInfo.lastEruption, volcanoInfo.status);
  
  // disegna informazioni a destra
  drawTypeInfoBlock(volcanoInfo.type, volcanoInfo.typeCategory);
}

function draw() {
  drawBackButton(); // disegna bottone
}

// bottone per tornare alla visualizzazione principale
function drawBackButton() {
  let isHovered = mouseX > backButton.x && 
                  mouseX < backButton.x + backButton.width && 
                  mouseY > backButton.y && 
                  mouseY < backButton.y + backButton.height;

  // gestione dell'effetto hover e del cursore
  if (isHovered) {
      fill(100); 
      cursor(HAND); 
  } else {
      fill(50); 
      cursor(ARROW); 
  }
  
  // disegna contenitore
  stroke(255);
  rect(backButton.x, backButton.y, backButton.width, backButton.height, 15); 
  
  // testo
  fill(255);
  textSize(15);
  textAlign(CENTER, CENTER);
  text(backButton.text, backButton.x + backButton.width / 2, backButton.y + backButton.height / 2); 
}

// gestione del click del mouse
function mouseClicked() {
    let isClicked = mouseX > backButton.x && 
                    mouseX < backButton.x + backButton.width && 
                    mouseY > backButton.y && 
                    mouseY < backButton.y + backButton.height;

    if (isClicked) {
        goToHomePage(); 
    }
}

// gestione della navigazione alla pagina principale
function goToHomePage() {
    window.location.href = "index.html"; 
}

// grafico
function drawElevationTriangleChart(elevation, lastEruptionString, volcanoStatus) {
    
    const numCategories = 10;
    
    let graphW = windowWidth * 0.60; 
    let graphH = windowHeight * 0.7; 
    let graphX = 20; 
    let graphY = 180; 
    let padding = 60;
    let innerX = graphX + padding;
    let innerY = graphY + padding;
    let innerW = graphW - 2 * padding;
    let innerH = graphH - 2 * padding;
    
    let chartData = getEruptionCategory(lastEruptionString);
    let eruptionIndex = chartData.index; 
    
    let triangleColor = getStatusColor(volcanoStatus);
    
    let slotWidth = innerW / numCategories;
    
    // etichette elevazione
    stroke(150);
    line(innerX, innerY, innerX, innerY + innerH);
    
    fill(255);
    textSize(12);
    textAlign(RIGHT, CENTER);
    text(round(maxGlobalElevation) + " m", innerX - 5, innerY);
    text(round(minGlobalElevation) + " m", innerX - 5, innerY + innerH);
    
    // linea dello zero
    let zeroY = map(0, minGlobalElevation, maxGlobalElevation, innerY + innerH, innerY);
    stroke(255); 
    line(innerX, zeroY, innerX + innerW, zeroY);
    
    // etichetta Zero
    textAlign(RIGHT, CENTER);
    text("0 m", innerX - 5, zeroY);
    
    // titolo asse y
    push(); 
    translate(graphX + 10, innerY + innerH / 2); 
    rotate(-HALF_PI); 
    noStroke();
    fill(200);
    textSize(16);
    textAlign(CENTER, CENTER);
    textStyle(BOLD);
    text("Elevation (m)", 0, 0);
    pop(); 
 
    // asse x
    line(innerX, innerY + innerH, innerX + innerW, innerY + innerH); 
    fill(200);
    textSize(10);
    textAlign(CENTER, TOP);
    textStyle(NORMAL);
    
    // etichette categorie x 
   const X_LABELS = ["Uncertain", "Quaternary", "Undated", "Holocene", "1-1499", "1500-1699", "1700-1799", "1800-1899", "1900-1963", "1964 or later"]; 
    for (let i = 0; i < numCategories; i++) {
        let labelX = innerX + i * slotWidth + slotWidth / 2;
        
        stroke(50);
        line(innerX + i * slotWidth, innerY, innerX + i * slotWidth, innerY + innerH);
        
        text(X_LABELS[i], labelX, innerY + innerH + 5);
    }
    
    // titolo asse x
    fill(200);
    textSize(16);
    textAlign(CENTER, TOP);
    textStyle(BOLD);
    text("Last Known Eruption", innerX + innerW / 2, innerY + innerH + 30);
    
    // disegna il triangolo
    if (eruptionIndex >= 0 && eruptionIndex < numCategories) { 
        let volcanoY = map(elevation, minGlobalElevation, maxGlobalElevation, innerY + innerH, innerY);
        let baseY = zeroY;
        let triangleXCenter = innerX + eruptionIndex * slotWidth + slotWidth / 2; 
        let triangleSize = 35; 
        
        fill(triangleColor);
        noStroke(); 
        
        if (elevation >= 0) {
            triangle(
                triangleXCenter, volcanoY,                         
                triangleXCenter - triangleSize, baseY,             
                triangleXCenter + triangleSize, baseY              
            );
            
            fill(255);
            textSize(14);
            textAlign(CENTER, BOTTOM);
            text(`${elevation} m`, triangleXCenter, volcanoY - 5);

        } else {
            triangle(
                triangleXCenter, volcanoY,                         
                triangleXCenter - triangleSize, baseY,             
                triangleXCenter + triangleSize, baseY              
            ); 
            fill(255);
            textSize(14);
            textAlign(CENTER, TOP);
            text(`${elevation} m`, triangleXCenter, volcanoY + 5);
        }
    }
    
    textStyle(NORMAL);
}

// mappa la stringa di "Last Known Eruption" ai 10 indici (asse X del grafico)
function getEruptionCategory(eruptionString) {
    let normalized = eruptionString.toUpperCase().trim();
    
    const categories = {    
        "?": { index: 0, name: "?: Uncertain Holocene", color: color(150) },
        "Q": { index: 1, name: "Q: Quaternary/Hydrothermal", color: color(255, 255, 0) },
        "U": { index: 2, name: "U: Probable Holocene", color: color(255, 200, 0) }, 
        "D7": { index: 3, name: "D7: B.C. (Holocene)", color: color(255, 100, 0) }, 
        "D6": { index: 4, name: "D6: A.D. 1-1499", color: color(255, 0, 0) }, 
        "D5": { index: 5, name: "D5: 1500-1699", color: color(200, 50, 50) }, 
        "D4": { index: 6, name: "D4: 1700-1799", color: color(150, 100, 50) }, 
        "D3": { index: 7, name: "D3: 1800-1899", color: color(100, 150, 50) }, 
        "D2": { index: 8, name: "D2: 1900-1963", color: color(50, 200, 50) }, 
        "D1": { index: 9, name: "D1: 1964 or later"} 
    };

    if (categories.hasOwnProperty(normalized)) {
        return categories[normalized];
    }
    
    return categories["?"];
}

// disegna le informazioni per il vulcano
function drawTypeInfoBlock(volcanoType, volcanoTypeCategory) {
    let blockW = windowWidth * 0.40 - 30; 
    let blockX = windowWidth * 0.60 + 10; 
    let blockY = 220; 
    let blockH = windowHeight * 0.7; 
    let textPadding = 15;
    
    let description = getVolcanoDescription(volcanoType);
    
    // Ottiene il colore dal sistema di mappatura coerente con la mappa
    let typeCategoryInfo = getVolcanoCategory(volcanoType);
    let typeColor = typeCategoryInfo.color;

    noFill(); 
    noStroke();
    rect(blockX, blockY, blockW, blockH, 10);
    
    let currentY = blockY + textPadding;
    let leftX = blockX + textPadding;

    // 1. sezione tipo di vulcano
    textAlign(LEFT, TOP);
    textStyle(NORMAL);
    fill(150); 
    textSize(14);
    text("TYPE", leftX, currentY);
    currentY += 15; 

    // categoria
    textStyle(BOLD);
    fill(typeColor); // mantiene il colore basato sulla categoria della mappa
    textSize(40);
    text(volcanoType.toUpperCase(), leftX, currentY);
    currentY += 45; 

    // categoria principale
    textStyle(NORMAL);
    fill(220);
    textSize(18);
    text(volcanoTypeCategory.toUpperCase(), leftX, currentY); 
    let separatorY1 = currentY + 30; 
    
    // linea di separazione
    push();
    stroke(200);
    line(leftX, separatorY1, blockX + blockW - textPadding, separatorY1);
    pop();

    // 2. sezione di descrizione
    currentY = separatorY1 + 15;
    noStroke();
    fill(255);
    textSize(16);
    textAlign(LEFT, TOP);
    textStyle(NORMAL);
    
    let availableSpaceForDescription = blockH - (currentY - blockY) - 250; 
    text(description, leftX, currentY, blockW - 2 * textPadding, availableSpaceForDescription); 
    let separatorY2 = currentY + availableSpaceForDescription + 15;

    // 3. sezione legenda status
    currentY = separatorY2-80;
    // titolo
    fill(255); 
    textStyle(BOLD);
    textSize(16); 
    text("STATUS", leftX, currentY); 
    currentY += 20;
    
    const legendW = blockW - 2 * textPadding;
    const legendH = 30; 
    const statusLegend = [
        { name: "HISTORICAL ERUPTION", status: "Historical" },
        { name: "HOLOCENE ERUPTION", status: "Holocene" },
        { name: "FUMAROLIC", status: "Fumarolic" },
        { name: "DOUBTFUL STATUS", status: "Doubtful" },
        { name: "NOT KNOWN", status: "No known" }
    ];
    
    for (let item of statusLegend) {
        let itemColor = getStatusColor(item.status);
        
        fill(itemColor);
        noStroke();
        rect(leftX, currentY, legendW, legendH); 
        
        fill(20); 
        textSize(14);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text(item.name, leftX + legendW / 2, currentY + legendH / 2);
        
        currentY += legendH + 5; 
    }
    
    // 4. sezione latitudine e longitudine 
    currentY += 28;
    textAlign(LEFT, TOP);
    fill(255);
    textSize(16);
    textStyle(NORMAL);
    
    // valori coordinate
    let lat = volcanoInfo.latitude;
    let lon = volcanoInfo.longitude; 
    let latText = (lat !== null && !isNaN(lat)) ? lat.toFixed(4) : '--';
    let lonText = (lon !== null && !isNaN(lon)) ? lon.toFixed(4) : '--';
    let coordinateString = `LATITUDE: ${latText}° | LONGITUDE: ${lonText}°`;
    text(coordinateString, leftX, currentY);
}

// restituisce una descrizione per ogni tipo di vulcano
function getVolcanoDescription(type) {
  let normalizedType = type.toLowerCase();

  if (normalizedType.includes("caldera")) {
    return "A large depression formed when a volcano’s summit or magma chamber collapses after a major eruption.";
  }
  else if (normalizedType.includes("shield")) {
    return "Broad, gently-sloping volcano built by low-viscosity lava flows over long periods. (Includes 'Pyroclastic shield').";
  }
  else if (
    normalizedType.includes("stratovolcano") ||
    normalizedType.includes("complex volcano") ||
    normalizedType.includes("compound volcano") ||
    normalizedType.includes("somma volcano")
  ) {
    return "A tall, conical volcano built by many layers of hardened lava, tephra, and volcanic ash. (Includes 'Compound', 'Somma', and 'Complex volcano').";
  }
  else if (
    normalizedType.includes("cinder cone") ||
    normalizedType.includes("scoria cone") ||
    normalizedType.includes("pumice cone") ||
    normalizedType.includes("pyroclastic cone") ||
    normalizedType.includes("lava cone") ||
    normalizedType.includes("lava dome")
  ) {
    if (normalizedType.includes("lava dome")) {
      return "A rounded mound formed by highly viscous lava extruding slowly, building up near the vent.";
    } else if (normalizedType.includes("scoria") || normalizedType.includes("cinder")) {
      return "A small, steep conical hill built from volcanic fragments (scoria) erupted from a single vent. (Includes 'Cinder cone', 'Scoria cone', 'Pyroclastic cone').";
    }
    return "A generic volcanic cone formed by ejected fragments or viscous lava piling up near the vent. (Includes 'Pumice cone', 'Lava cone').";
  }
  else if (
    normalizedType.includes("fissure vent") ||
    normalizedType.includes("crater rows") ||
    normalizedType.includes("explosion crater") ||
    normalizedType.includes("volcanic field")
  ) {
    if (normalizedType.includes("fissure vent")) {
      return "A linear crack in the crust through which lava erupts, often forming a row of vents. (Includes 'Fissure vents').";
    } else if (normalizedType.includes("volcanic field")) {
      return "A non-single edifice area of volcanic activity – many vents and volcanoes across an area.";
    }
    return "A system with multiple craters, such as a line of craters along fissures or a crater formed by explosive activity (e.g., 'Explosion crater').";
  }
  else if (
    normalizedType.includes("maar") ||
    normalizedType.includes("tuff cone") ||
    normalizedType.includes("tuff ring")
  ) {
    return "A broad, shallow crater formed by explosive interaction of magma with groundwater (phreatomagmatic). (Includes 'Tuff cone' and 'Tuff rings').";
  }
  else if (normalizedType.includes("submarine")) {
    return "A volcano whose edifice is wholly or partly beneath the sea surface. (Includes uncertain classification 'Submarine volcano?').";
  } else if (normalizedType.includes("subglacial")) {
    return "A volcano erupted beneath ice or a glacier, creating unique geomorphology.";
  }
  else if (normalizedType.includes("fumarole field")) {
    return "An area where volcanic gases and steam escape through surface vents, without major lava flows.";
  } else if (normalizedType.includes("hydrothermal field")) {
    return "A zone of geothermal activity (hot springs, steam vents) often linked with volcanic systems.";
  } else if (normalizedType.includes("mud volcano")) {
    return "A surface feature where mud, water and gas vent from the subsurface; not always magmatic in origin.";
  }
  else if (normalizedType.includes("not volcanic")) {
    return "Indicates the feature is classified as non-volcanic (not a true volcanic edifice).";
  } else if (normalizedType.includes("unknown")) {
    return "Indicates the volcano type is not determined or classified.";
  }

  return "Unclassified or unknown type. Shape and eruptive behavior are variable.";
}

// mappa la stringa di status a un colore
function getStatusColor(statusString) {
    let normalized = statusString.toLowerCase().trim();

    if (normalized.includes("historical")) {
        return color("#832D51"); 
    }
    else if (normalized.includes("holocene") || normalized.includes("eruption")) {
        return color("#EA6993"); 
    }
    else if (normalized.includes("fumarolic")) {
        return color("#F8CAE4"); 
    }
    else if (normalized.includes("doubtful")) {
        return color("#CFDD9D"); 
    }
    else if (normalized.includes("no known")) {
        return color("#447A5F"); 
    }

    return color("#447A5F"); 
}

// funzione colori presa da sketch.js
function getVolcanoCategory(type) {
  const normalizedType = type.trim().toLowerCase(); 
  let categoryName = 'Other';
  let categoryColor = color(129, 129, 129); 

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