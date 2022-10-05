var START_YEAR = 8;
var END_YEAR = 21;
var PROJECT_PATH = 'projects/ee-imoliveira/assets/papa-alpha-prodes/';
var ROI = ee.Geometry.Rectangle([-76.9908, -16.2915, -45.0121, 5.2718]);

/**
 * Datasets
 */

var prodes = ee.Image(PROJECT_PATH + 'PDigital2000_2021_AMZ_raster_v20220824');
var prodesMask = prodes.gte(START_YEAR).and(prodes.lte(END_YEAR));
var prodesLayer = ui.Map.Layer(prodes.updateMask(prodesMask).selfMask());
var scale = prodes.select(0).projection().nominalScale();

var protectedAreasData = ee.FeatureCollection('WCMC/WDPA/current/polygons');
var protectedAreasLayer = ui.Map.FeatureViewLayer('WCMC/WDPA/current/polygons_FeatureView');

var backgroundLayer = ui.Map.Layer(ee.Image(0), {opacity: 0.6});

/**
 * Pre-processing PRODES data.
 */

var years2D = ee.List.sequence(START_YEAR, END_YEAR);
var years4D = years2D.map(function(y) {
  return ee.Number(y).add(2000).format('%d');
});

years2D = years2D.getInfo();
years4D = years4D.getInfo();

prodes = prodes
  .updateMask(prodesMask)
  .selfMask()
  .eq(years2D)
  .rename(years4D)
  .multiply(ee.Image.pixelArea())
  .divide(10000);

var ticks = years4D.map(function(y) {
  return new Date(y);
});

/**
 * Pre-processing WDPA data.
 */

var symbols = {
  'search': 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/search/wght300/24px.svg',
  'hide': 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/visibility_off/wght300/24px.svg',
  'show': 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/visibility/wght300/24px.svg',
  'deselect': 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/deselect/wght300/24px.svg',
  'filterAlt': 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/filter_alt/wght300/24px.svg',
  'filterAltOff': 'https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/filter_alt_off/wght300/24px.svg'
};

var tableSchemaDescription = {
  'WDPAID': 'Unique identifier for a protected area (PA), assigned by UNEP-WCMC.',
  'WDPA_PID': 'Unique identifier for parcels or zones within a PA, assigned by UNEP-WCMC.',
  // 'PA_DEF': 'PA definition. Whether this site meets the IUCN and/or CBD definition of a PA: 1=yes, 0=no (currently stored outside WDPA).',
  'NAME': 'Name of the PA as provided by the data provider.',
  'ORIG_NAME': 'Name of the PA in the original language.',
  // 'DESIG': 'Designation of the PA in the native language.',
  // 'DESIG_ENG': 'Designation of the PA in English. Allowed values for international-level designations: Ramsar Site, Wetland of International Importance; UNESCO-MAB Biosphere Reserve; or World Heritage Site. Allowed values for regional-level designations: Baltic Sea Protected Area (HELCOM), Specially Protected Area (Cartagena Convention), Marine Protected Area (CCAMLR), Marine Protected Area (OSPAR), Site of Community Importance (Habitats Directive), Special Protection Area (Birds Directive), or Specially Protected Areas of Mediterranean Importance (Barcelona Convention). No fixed values for PAs designated at a national level.',
  // 'DESIG_TYPE': 'Designation type, one of: national, regional, international, or not applicable.',
  // 'IUCN_CAT': 'IUCN management category, one of: Ia (strict nature reserve), Ib (wilderness area), II (national park), III (natural monument or feature), IV (habitat/species management area), V (protected landscape/seascape), VI (PA with sustainable use of natural resources), not applicable, not assigned, or not reported.',
  // 'INT_CRIT': 'International criteria, assigned by UNEP-WCMC. For World Heritage and Ramsar sites only.',
  // 'MARINE': 'This field describes whether a PA falls totally or partially within the marine environment, one of: 0 (100% terrestrial PA), 1 (coastal: marine and terrestrial PA), or 2 (100% marine PA).',
  // 'NO_TAKE': 'No take means that the taking of living or dead natural resources, inclusive of all methods of fishing, extraction, dumping, dredging and construction, is strictly prohibited in all or part of a marine PA. This is only applicable to PAs where the field marine = 1 or 2. One of: all, part, none, not reported, or not applicable (if MARINE field = 0).',
  // 'STATUS': 'Status of a PA, one of: proposed, inscribed, adopted, designated, or established.',
  // 'GOV_TYPE': 'Description of the decision-making structure of a PA. One of: federal or national ministry or agency, sub-national ministry or agency, government-delegated management, transboundary governance, collaborative governance, joint governance, individual landowners, non-profit organizations, for-profit organizations, indigenous peoples, local communities, or not reported.',
  // 'OWN_TYPE': 'Ownership type, one of: state, communal, individual landowners, for-profit organizations, non-profit organizations, joint ownership, multiple ownership, contested, or not Reported.',
  // 'MANG_AUTH': 'Management authority. Agency, organization, individual or group that manages the PA.',
  // 'MANG_PLAN': 'Link or reference to the PAs management plan.',
  // 'VERIF': 'Verification status, assigned by UNEP-WCMC. One of: state verified, expert verified, not reported (for unverified data that was already in the WDPA prior to the inclusion of the "Verification field").',
  // 'SUB_LOC': 'Sub-national location. ISO 3166-2 sub-national code where the PA is located. If the PA is in more than one state, province, region etc., multiple ISO-3166-2 codes can be listed separated by a comma and space.',
  // 'PARENT_ISO': 'Parent ISO3 code. ISO 3166-3 character code of country where the PA is located.',
  // 'ISO3': 'ISO3 Code. ISO 3166-3 character code of the country or territory where the PA is located.',
};

var tableSchemaExample = {
  'WDPAID': '555637329',
  'WDPA_PID': '555637329',
  // 'PA_DEF': '1',
  'NAME': 'Fernando de Noronha Archipelago',
  'ORIG_NAME': 'Fernando de Noronha Archipelago',
  // 'DESIG': 'Ramsar Site, Wetland of International Importance',
  // 'DESIG_ENG': 'Ramsar Site, Wetland of International Importance',
  // 'DESIG_TYPE': 'International',
  // 'IUCN_CAT': 'II',
  // 'INT_CRIT': '(i)(ii)(iii)(iv)(vii)(viii)',
  // 'MARINE': '1',
  // 'NO_TAKE': 'None',
  // 'STATUS': 'Designated',
  // 'GOV_TYPE': 'Federal or national ministry or agency',
  // 'OWN_TYPE': 'State',
  // 'MANG_AUTH': 'ICMBio',
  // 'MANG_PLAN': 'https://rsis.ramsar.org/RISapp/files/43173876/documents/BR2333_mgt171211.pdf',
  // 'VERIF': 'State Verified',
  // 'SUB_LOC': 'BR-PE',
  // 'PARENT_ISO': 'BRA',
  // 'ISO3': 'BRA',
};

/**
 * Styles
 */

var TITLE_STYLE = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0px 0px 0px 8px'
};
var SUBTITLE_STYLE = {
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '2px 0px 8px 8px',
  color: 'gray'
};
var PRODES_STYLE = {
  min: START_YEAR,
  max: END_YEAR,
  palette: ['#ffffcc', '#ffeda0', '#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c', '#bd0026', '#800026']
};
var PA_DEFAULT_STYLE = {
  color: '#abdda4',
  rules: [
    {
      filter: ee.Filter.neq('ISO3', 'BRA'),
      isVisible: false
    }
  ]
};
var PA_STYLE = {
  color: '#abdda4'
};
var HIGHLIGHT_STYLE = {
  color: '#ffffff'
};

prodesLayer.setVisParams(PRODES_STYLE);
protectedAreasLayer.setVisParams(PA_DEFAULT_STYLE);

/**
 * Event handlers and helper functions
 */

function createControlWidgets(layer, checkboxLabel, checkboxValue) {
  var checkbox = ui.Checkbox({
    label: checkboxLabel,
    value: checkboxValue,
    onChange: function(value) {
      layer.setShown(value);
    }
  });
  var slider = ui.Slider({
    min: 0,
    max: 1,
    value: 1,
    step: 0.1
  });
  slider.onSlide(function(value) {
    layer.setOpacity(value);
  });
  slider.style().set('fontSize', '0px');
  return ui.Panel({
    widgets: [checkbox, slider],
    layout: ui.Panel.Layout.flow('horizontal')
  });
}

function updateInfo(value) {
  searchTextbox.setPlaceholder(tableSchemaExample[value]);
  propertyDescription.setValue(tableSchemaDescription[value]);
  propertyDescription.style().set('shown', true);
}

function getPAInfo(coords) {
  var pt = ee.Geometry.Point([coords.lon, coords.lat]);
  
}

/**
 * Widgets
 */

var title = ui.Label('Áreas Protegidas', TITLE_STYLE);
var subtitle = ui.Label('PRODES', SUBTITLE_STYLE);
var startYearString = (START_YEAR.toString().length > 1 ? '20' : '200') + START_YEAR;
var endYearString = (END_YEAR.toString().length > 1 ? '20' : '200') + END_YEAR;
var about = ui.Label('Obtenha o histórico de perda florestal nas áreas protegidas no período de ' + startYearString + ' a ' + endYearString + '.');

var searchTextbox = ui.Textbox({placeholder: 'PA-1503754-D536E81A27F647C1B50ED28BD27A941B'});
var searchSelector = ui.Select({items: Object.keys(tableSchemaDescription), onChange: updateInfo});
var searchButton = ui.Button({label: 'Pesquisar', /*onClick: searchCar,*/ imageUrl: symbols.search});
var deselectButton = ui.Button({label: 'Remover Seleção', /*onClick: clearSelection,*/ disabled: true, imageUrl: symbols.deselect, style: {'shown': false}});
var showHideButton = ui.Button({label: 'Mostrar/Esconder Gráfico', imageUrl: symbols.hide, /*onClick: showHideChart,*/ disabled: true, style: {'shown': false}});
var searchPanel = ui.Panel({
  widgets: [searchTextbox, searchSelector, searchButton, deselectButton, showHideButton],
  layout: ui.Panel.Layout.flow('horizontal')
});

var propertyDescription = ui.Label('', {shown: false});

var protectedAreasControls = createControlWidgets(protectedAreasLayer, 'Protected Areas', true);
var chartPanel = ui.Panel();
var prodesControls = createControlWidgets(prodesLayer, 'PRODES', true);
var inspectorPanel = ui.Panel();

var panel = ui.Panel({
  widgets: [
    title,
    subtitle,
    about,
    searchPanel,
    propertyDescription,
    protectedAreasControls,
    chartPanel,
    prodesControls,
    inspectorPanel
  ],
  style: {
    position: 'bottom-left',
    width: '400px',
    padding: '22px 8px 22px 8px'
  }
});

/**
 * Composition
 */

Map.layers().add(backgroundLayer);
Map.layers().add(prodesLayer);
Map.layers().add(protectedAreasLayer);

ui.root.insert(0, panel);

/**
 * Estilos das camadas.
 */




/**
 * Configuração do mapa.
 */
Map.centerObject(ROI);
Map.setOptions('SATELLITE');
Map.setControlVisibility({all: false, zoomControl: true});
Map.style().set({cursor: 'crosshair'});

/**
 * Helpers.
 */

// Oculta um widget oculto.
function hide(w) {
  w.style().set('shown', false);
}

// Torna um widget visível.
function show(w) {
  w.style().set('shown', true);
}

// Habilita um widget.
function enable(w) {
  w.setDisabled(false);
}

// Desabilita um widget.
function disable(w) {
  w.setDisabled(true);
}

// Último parâmetro de visualização definido.
var lastVisParams = {};
// Atualiza os parâmetros de visualização de uma camada.
function updateVisParams(codigoCar) {
  if (tipoImovel.length > 0) { // Há um tipo de imóvel selecionado
    carLayer.setVisParams({
      rules: [
        { // Oculta imóveis não selecionados.
          filter: ee.Filter.neq('tipo_imove', tipoImovel[0]),
          isVisible: false
        },
        {
          filter: ee.Filter.eq('cod_car', codigoCar),
          color: '#ffffff'
        },
        {
          filter: ee.Filter.neq('cod_car', codigoCar),
          color: CAR_STYLE.color
        }
      ]
    });
  } else { // Todos os imóveis selecionados
    carLayer.setVisParams({
      rules: [
        { // Destaca o imóvel intersectado pelo ponto clicado.
          filter: ee.Filter.eq('cod_car', codigoCar),
          color: HIGHLIGHT_STYLE.color
        },
        { // Deixa os demais imóveis transparentes.
          filter: ee.Filter.neq('cod_car', codigoCar),
          color: CAR_STYLE.color
        }
      ]
    });
  }

  lastVisParams = Object.keys(lastVisParams).length > 0 ? carLayer.getVisParams() : CAR_STYLE;
}

// Armazena o código do CAR do imóvel selecionado.
var carSelecionado = [];
// Gera o gráfico.
function createChart(regions) {
  var chart = ui.Chart.image.regions({
    image: prodes,
    regions: regions,
    reducer: ee.Reducer.sum(),
    scale: scale,
    seriesProperty: 'label'
  }).setChartType('ColumnChart');

  chart.setOptions({
    title: (
      'Perda florestal no período de ' + (START_YEAR.toString().length > 1 ? '20' : '200') + START_YEAR + ' a ' + (END_YEAR.toString().length > 1 ? '20' : '200') + END_YEAR + '\n' +
      carSelecionado[0]
    ).toUpperCase(),
    titleTextStyle: {
      bold: true
    },
    vAxis: {
      title: 'Área (ha)',
      titleTextStyle: {
        bold: false,
        italic: false
      }
    },
    hAxis: {
      title: null,
      ticks: ticks,
      format: 'yyyy',
      showTextEvery: 1,   // Texto a cada 1 ano.
      slantedText: false, // Texto inclinado?
      maxAlternation: 2   // Número máximo de linhas.
    },
    legend: {position: 'none'},
    fontName: FONT_FAMILY,
    chartArea: {
      left: '15%',
      width: '75%'
    },
    colors: [CAR_STYLE.color],
    fontSize: 11
  });
  chart.style().set('stretch', 'both');
  chart.style().set('margin', '0px');
  // Adiciona o gráfico ao painel
  chartPanel.widgets().reset([chart]);
}

// Busca pelo car fornecido pelo usuário.
function searchCar() {
  var codigoCar = searchTextbox.getValue();
  var filtered = carData.filter(ee.Filter.eq('cod_car', codigoCar));
  // Verificar se houve um retorno positivo da busca.
  filtered.evaluate(function(filtered) {
    // Caso positivo (encontrou um resultado).
    if (filtered.features.length > 0) {
      // Habilita os botões de mostrar/ocultar o gráfico e limpar seleção.
      enable(deselectButton);
      show(deselectButton);
      enable(showHideButton);
      show(showHideButton);
      // Centralizar o mapa.
      var feature = filtered.features[0];
      var geometry = ee.Geometry(feature.geometry);
      Map.centerObject(geometry);
      // Salva o código do car.
      carSelecionado[0] = feature.properties.cod_car;
      // Alterar o estilo da camada (destaque à propriedade selecionada)
      updateVisParams(codigoCar);
      // Gerar o gráfico
      createChart(ee.FeatureCollection([feature]));
      // Mostrar o painel do gráfico
      show(chartPanel);
      // Altera o símbolo de mostrar/ocultar o gráfico
      showHideButton.setImageUrl(symbols.hide);
    }
  });
}

// Seleciona o CAR a partir do clique no mapa.
function getCAR(coords) {
  var point = ee.Geometry.Point([coords.lon, coords.lat]);
  // Obtem as camadas ativas no momento do clique.
  updateActiveLayers();
  // Reseta os painéis de informações.
  resetInfoPanels();
  // Obtem as propriedades das camadas que intersectam o ponto clicado.
  getProperties(point);
  // Filtra os dados do CAR de acordo com o tipo de imóvel selecionado no selector.
  var dataset = tipoImovel.length > 0 ? carData.filter(ee.Filter.eq('tipo_imove', tipoImovel[0])) : carData;
  // Obtém o imóvel que intersecta o ponto clicado e, caso retorne mais de um imóvel,
  // seleciona aquele com a data da última retificação mais atual.
  var filtered = dataset.filterBounds(point).sort('data_ref', false);
  // Verifica se houve um retorno positivo da busca.
  filtered.evaluate(function(filtered) {
    // Caso positivo (encontrou um resultado).
    if (filtered.features.length > 0) {
      // Habilita os botões de mostrar/ocultar o gráfico e limpar seleção.
      enable(deselectButton);
      show(deselectButton);
      enable(showHideButton);
      show(showHideButton);
      // Centralizar o mapa.
      var feature = filtered.features[0];
      var codigoCar = feature.properties.cod_car;
      var geometry = ee.Geometry(feature.geometry);
      Map.centerObject(geometry);
      // Salva o código do car.
      carSelecionado[0] = feature.properties.cod_car;
      // Alterar o estilo da camada (destaque à propriedade selecionada)
      updateVisParams(codigoCar);
      // Gerar o gráfico
      createChart(ee.FeatureCollection([feature]));
      // Mostrar o painel do gráfico
      show(chartPanel);
      // Altera o símbolo de mostrar/ocultar o gráfico
      showHideButton.setImageUrl(symbols.hide);
    }
  });
}
Map.onClick(getCAR);

// Limpa seleção e define os parâmetros de visualização padrão.
function clearSelection() {
  // Mantém as camadas selecionadas e remove o destaque
  var visParams = {
    color: CAR_STYLE.color
  };
  if (tipoImovel.length > 0) {
    visParams.rules = [
      {
        filter: ee.Filter.eq('tipo_imove', tipoImovel[0]).not(),
        isVisible: false
      }
    ];
  }
  carLayer.setVisParams(visParams);

  hide(chartPanel);
  disable(showHideButton);
  hide(showHideButton);
  disable(deselectButton);
  hide(deselectButton);
};


var H1_STYLE = {
  fontFamily: FONT_FAMILY,
  fontWeight: 'bold',
  margin: '12px 0px 0px 8px'
};

var TEXBOX_STYLE = {
  fontFamily: FONT_FAMILY,
  width: '192px',
  padding: '0.5px 0px'
};





// Tipo(s) de imóvel(eis) utilizado(s) para filtrar a camada CAR.
var tipoImovel = [];
// Filtra os dados do CAR de acordo com o tipo de imóvel selecionado no selector.
function filterFeatureView(value) {
  if (value === null) {
    carLayer.setVisParams(CAR_STYLE);
  } else {
    carLayer.setVisParams({
      color: CAR_STYLE.color,
      rules: [
        {
          filter: ee.Filter.eq('tipo_imove', value).not(),
          isVisible: false
        }
      ]
    });
    tipoImovel = [];
    tipoImovel.push(value);
  }
}

var CHECKBOX_STYLE = {
  fontFamily: FONT_FAMILY,
  margin: '10px 8px 0px 8px'
};

var carCheckbox = ui.Checkbox({
  label: 'Cadastro Ambiental Rural',
  value: true,
  onChange: function(value) {
    // Mostra-oculta a camada de acordo com o valor do Checkbox.
    carLayer.setShown(value);
    // Habilita-desabilita o seletor do tipo de imóvel.
    tipoImovelSelector.setDisabled(!value);
  },
  style: CHECKBOX_STYLE
});

var items = [
  {label: 'Todos os Imóveis', value: null},
  {label: 'Imóveis Rurais', value: 'IRU'},
  {label: 'Assentamentos de Reforma Agrária', value: 'AST'},
  {label: 'Povos e Comunidades Tradicionais', value: 'PCT'},
];
var tipoImovelSelector = ui.Select({
  items: items,
  placeholder: items[0].label,
  onChange: filterFeatureView,
  style: {fontFamily: FONT_FAMILY}
});



// Cria um checkbox e um painel de informações para cada camada.
function createCheckboxAndInfoPanel(label, value) {
  var layer = modelMap[label].layer;
  var infoPanel = ui.Panel({
    style: {
      shown: false,
      whiteSpace: 'pre'
    }
  });
  var checkbox = ui.Checkbox({
    label: label,
    value: value || false,
    onChange: function(value) {
      layer.setShown(value);
      if (infoPanel.style().get('shown')) {
        hide(infoPanel);
      } else {
        show(infoPanel);
      }
    },
    style: CHECKBOX_STYLE
  });
  return ui.Panel([checkbox, infoPanel]);
}

var jbsInfo = createCheckboxAndInfoPanel('JBS');
var marfrigInfo = createCheckboxAndInfoPanel('Marfrig');
var minervaInfo = createCheckboxAndInfoPanel('Minerva');
var sojaInfo = createCheckboxAndInfoPanel('Soja');

var checkboxesAndInfoPanels = [jbsInfo, marfrigInfo, minervaInfo, sojaInfo];

// Obter os checkboxes.
var checkboxes = checkboxesAndInfoPanels.map(function(panel) {
  return panel.widgets().get(0);
});

// Objeto {nomeCamada: panelInfo}
var infoPanelMap = {};
checkboxesAndInfoPanels.forEach(function(panel) {
  var label = panel.widgets().get(0).getLabel();
  var infoPanel = panel.widgets().get(1);
  infoPanelMap[label] = infoPanel;
});

// Reseta os painéis de informação.
function resetInfoPanels() {
  Object.keys(infoPanelMap).forEach(function(layerName) {
    infoPanelMap[layerName].widgets().reset();
  });
}

// Armazena as camadas ativas.
var activeLayers = [];
// Atualiza as camadas ativas.
function updateActiveLayers() {
  activeLayers = [];
  checkboxes.forEach(function(checkbox) {
    var value = checkbox.getValue();
    if (value) {
      var label = checkbox.getLabel();
      activeLayers.push(label);
    }
  });
}

var INFO_STYLE = {
  fontFamily: FONT_FAMILY
};

// Extrai as propriedades das camadas ativas e as mostra em seus respectivos painéis.
// Só terá efeito se pelo menos uma camada estiver ativa.
function getProperties(point) {
  if (activeLayers.length > 0) {
    activeLayers.forEach(function(layerName) {
      var data = modelMap[layerName].data;
      var infoPanel = infoPanelMap[layerName];
      var filtered = data.filterBounds(point);
      filtered.evaluate(function(filtered) {
        if (filtered.features.length > 0) {
          show(infoPanel);
          var feature = filtered.features[0];
          var properties = feature.properties;
          var value = '';
          Object.keys(properties).forEach(function(propertyName) {
            value = value + propertyName + ': ' + properties[propertyName] + '\n';
          });
          var label = ui.Label(value.toUpperCase(), INFO_STYLE);
          infoPanel.widgets().reset([label]);
        }
      });
    });
  }
}

var panel = ui.Panel({
  widgets: [
    title,
    subtitle,
    about,
    ui.Label('OPÇÃO 1', H1_STYLE),
    ui.Label('Busque pelo número de registro no CAR:', BODY_STYLE),
    searchPanel,
    ui.Label('OPÇÃO 2', H1_STYLE),
    ui.Label('Clique em um dos imóveis mostrados no mapa.', BODY_STYLE),
    carCheckbox,
    ui.Label('Utilize o seletor para filtrar os imóveis de acordo com seu tipo.', {fontFamily: FONT_FAMILY, fontSize: '12px', color: 'gray', margin: '4px 8px 0px'}),
    tipoImovelSelector,
    ui.Label('CAMADAS', H1_STYLE),
    jbsInfo,
    marfrigInfo,
    minervaInfo,
    sojaInfo
  ],
  style: {
    position: 'middle-left',
    width: '400px',
    padding: '22px 8px 22px 8px'
  }
});

Map.widgets().add(panel);

/**
 * Painel do gráfico
 */

var CHART_PANEL_STYLE = {
  padding: '4px',
  position: 'bottom-right',
  width: '500px',
  height: '300px',
};
var BUTTON_STYLE = {
  position: 'middle-right',
  margin: '0px'
};

// Mostra/oculta o painel do gráfico.
function showHideChart() {
  var isShown = chartPanel.style().get('shown');
  var url = isShown ? symbols.show : symbols.hide;
  var shown = isShown ? false : true;
  showHideButton.setImageUrl(url);
  chartPanel.style().set('shown', shown);
}

var chartPanel = ui.Panel({style: {'shown': false}});
chartPanel.style().set(CHART_PANEL_STYLE);

Map.widgets().add(chartPanel);