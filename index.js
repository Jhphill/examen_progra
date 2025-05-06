const csvUrl = "https://raw.githubusercontent.com/rudyluis/DashboardJS/refs/heads/main/global_cancer.csv";
let allData = [];

$(document).ready(function() {
    $.ajax({
        url: csvUrl,
        dataType: 'text',
        success: function(data) {
            const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
            if (parsed.errors.length > 0) {
                console.error("Errores al parsear el CSV:", parsed.errors);
                $('#tableError').text('Error al procesar los datos del CSV');
                return;
            }
            // Transformar valores numéricos en categóricos
            allData = parsed.data.filter(d => d.Patient_ID).map(d => ({
                ...d,
                Smoking: parseFloat(d.Smoking) > 5 ? 'Sí' : 'No',
                Alcohol_Use: parseFloat(d.Alcohol_Use) < 3 ? 'Bajo' : parseFloat(d.Alcohol_Use) < 6 ? 'Moderado' : 'Alto',
                Obesity_Level: parseFloat(d.Obesity_Level) < 3 ? 'Bajo' : parseFloat(d.Obesity_Level) < 6 ? 'Medio' : 'Alto'
            }));
            if (allData.length === 0) {
                console.error("No se encontraron datos válidos en el CSV");
                $('#tableError').text('No se encontraron datos válidos en el CSV');
                return;
            }
            console.log('Datos cargados:', allData);
            popularFiltros();
            aplicarFiltrosYGraficos();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error al cargar el CSV:", textStatus, errorThrown);
            $('#tableError').text('Error al cargar los datos: ' + textStatus);
        }
    });

    $('#filterPais, #filterCiudad, #filterAnio, #filterCategoria').on('change', function() {
        popularFiltros();
        aplicarFiltrosYGraficos();
    });

    $('#resetFilters').on('click', function() {
        $('#filterPais, #filterCiudad, #filterAnio, #filterCategoria').val('');
        popularFiltros();
        aplicarFiltrosYGraficos();
    });
});
$(document).ready(function() {
  // Mostrar mensaje de carga
  $('#tableError').text('Cargando datos, por favor espera...');

  $.ajax({
      url: csvUrl,
      dataType: 'text',
      success: function(data) {
          const parsed = Papa.parse(data, { header: true, skipEmptyLines: true });
          if (parsed.errors.length > 0) {
              console.error("Errores al parsear el CSV:", parsed.errors);
              $('#tableError').text('Error al procesar los datos del CSV');
              return;
          }
          allData = parsed.data.filter(d => d.Patient_ID).map(d => ({
              ...d,
              Smoking: parseFloat(d.Smoking) > 5 ? 'Sí' : 'No',
              Alcohol_Use: parseFloat(d.Alcohol_Use) < 3 ? 'Bajo' : parseFloat(d.Alcohol_Use) < 6 ? 'Moderado' : 'Alto',
              Obesity_Level: parseFloat(d.Obesity_Level) < 3 ? 'Bajo' : parseFloat(d.Obesity_Level) < 6 ? 'Medio' : 'Alto'
          }));
          if (allData.length === 0) {
              console.error("No se encontraron datos válidos en el CSV");
              $('#tableError').text('No se encontraron datos válidos en el CSV');
              return;
          }
          console.log('Datos cargados:', allData);
          $('#tableError').text(''); // Limpiar mensaje de carga
          aplicarFiltrosDesdeURL(); // Aplicar filtros desde la URL
          popularFiltros();
          aplicarFiltrosYGraficos();
      },
      error: function(jqXHR, textStatus, errorThrown) {
          console.error("Error al cargar el CSV:", textStatus, errorThrown);
          $('#tableError').text('Error al cargar los datos: ' + textStatus);
      }
  });

  // Evento para resetear filtros
  $('#resetFilters').on('click', function() {
      $('#filterPais, #filterAnio, #filterCategoria').val('');
      aplicarFiltrosYGraficos();
  });

  // Evento para aplicar filtros al cambiar selects
  $('#filterPais, #filterAnio, #filterCategoria').on('change', aplicarFiltrosYGraficos);
});

// Nueva función para aplicar filtros desde la URL
function aplicarFiltrosDesdeURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const country = urlParams.get('country');
  const year = urlParams.get('year');
  const cancerType = urlParams.get('cancerType');

  if (country) $('#filterPais').val(country).trigger('change');
  if (year) $('#filterAnio').val(year).trigger('change');
  if (cancerType) $('#filterCategoria').val(cancerType).trigger('change');
}

// Resto del código (popularFiltros, aplicarFiltrosYGraficos, renderGraficos) permanece igual
function popularFiltros() {
    const paisSel = $('#filterPais').val();
    const ciudadSel = $('#filterCiudad').val();
    const anioSel = $('#filterAnio').val();
    const catSel = $('#filterCategoria').val();

    const filtrado = allData.filter(d =>
        (!paisSel || d.Country_Region === paisSel) &&
        (!ciudadSel || d.City === ciudadSel) &&
        (!anioSel || d.Year === anioSel) &&
        (!catSel || d.Cancer_Type === catSel)
    );

    const unique = (arr, key) => [...new Set(arr.map(d => d[key]).filter(Boolean))].sort();
    
    actualizarCombo('#filterPais', unique(filtrado, 'Country_Region'));
    actualizarCombo('#filterCiudad', unique(filtrado, 'City'));
    actualizarCombo('#filterAnio', unique(filtrado, 'Year'));
    actualizarCombo('#filterCategoria', unique(filtrado, 'Cancer_Type'));
}

function actualizarCombo(id, valores) {
    const select = $(id);
    const valorActual = select.val();
    select.empty().append(`<option value="">Todos</option>`);
    valores.forEach(v => select.append(`<option value="${v}">${v}</option>`));
    if (valores.includes(valorActual)) select.val(valorActual);
}

function aplicarFiltrosYGraficos() {
    const pais = $('#filterPais').val();
    const ciudad = $('#filterCiudad').val();
    const anio = $('#filterAnio').val();
    const categoria = $('#filterCategoria').val();

    const filtrado = allData.filter(d =>
        (!pais || d.Country_Region === pais) &&
        (!ciudad || d.City === ciudad) &&
        (!anio || d.Year === anio) &&
        (!categoria || d.Cancer_Type === categoria)
    );

    cargarTabla(filtrado);
    renderGraficos(filtrado);
}

function cargarTabla(data) {
    const tabla = $('#tablaDatos').DataTable();
    tabla.clear().destroy();

    const cuerpo = data.map(d => [
        d.Patient_ID, d.Age, d.Gender, d.Country_Region, d.Year,
        d.Genetic_Risk, d.Air_Pollution, d.Alcohol_Use, d.Smoking,
        d.Obesity_Level, d.Cancer_Type, d.Cancer_Stage, d.Treatment_Cost_USD,
        d.Survival_Years, d.Target_Severity_Score
    ]);

    $('#tablaDatos').DataTable({
        data: cuerpo,
        columns: [
            { title: "ID del Paciente" },
            { title: "Edad" },
            { title: "Género" },
            { title: "Región" },
            { title: "Año" },
            { title: "Riesgo Genético" },
            { title: "Contaminación del Aire" },
            { title: "Consumo de Alcohol" },
            { title: "Tabaquismo" },
            { title: "Nivel de Obesidad" },
            { title: "Tipo de Cáncer" },
            { title: "Etapa del Cáncer" },
            { title: "Costo del Tratamiento (USD)" },
            { title: "Años de Supervivencia" },
            { title: "Puntuación de Severidad Objetivo" }
        ],
        pageLength: 10,
        responsive: true,
        destroy: true
    });
}

function renderGraficos(data) {
  // Destroy existing charts
  Object.values(Chart.instances).forEach(chart => chart.destroy());

  // Aggregate data for charts (mismo código anterior, omitido por brevedad)
  const casosPorPais = {};
  const tipoCancerData = {};
  const casosPorAnio = {};
  const supervivenciaPorAnio = {};
  const tabaquismoData = { Sí: 0, No: 0 };
  const obesidadData = { Bajo: 0, Medio: 0, Alto: 0 };
  const alcoholPorGenero = { 
      Masculino: { Bajo: 0, Moderado: 0, Alto: 0 }, 
      Femenino: { Bajo: 0, Moderado: 0, Alto: 0 },
      Other: { Bajo: 0, Moderado: 0, Alto: 0 }
  };
  const contaminacionPorRegion = {};
  const costoPorTipoCancer = {};
  const factoresRiesgoPorRegion = {};
  const severidadPorEtapa = {};

  data.forEach(d => {
      casosPorPais[d.Country_Region] = (casosPorPais[d.Country_Region] || 0) + 1;
      tipoCancerData[d.Cancer_Type] = (tipoCancerData[d.Cancer_Type] || 0) + 1;
      casosPorAnio[d.Year] = (casosPorAnio[d.Year] || 0) + 1;
      if (!supervivenciaPorAnio[d.Year]) supervivenciaPorAnio[d.Year] = { total: 0, count: 0 };
      supervivenciaPorAnio[d.Year].total += parseFloat(d.Survival_Years || 0);
      supervivenciaPorAnio[d.Year].count++;
      tabaquismoData[d.Smoking] = (tabaquismoData[d.Smoking] || 0) + 1;
      obesidadData[d.Obesity_Level] = (obesidadData[d.Obesity_Level] || 0) + 1;
      if (alcoholPorGenero[d.Gender]) {
          alcoholPorGenero[d.Gender][d.Alcohol_Use] = (alcoholPorGenero[d.Gender][d.Alcohol_Use] || 0) + 1;
      }
      if (!contaminacionPorRegion[d.Country_Region]) contaminacionPorRegion[d.Country_Region] = { total: 0, count: 0 };
      contaminacionPorRegion[d.Country_Region].total += parseFloat(d.Air_Pollution || 0);
      contaminacionPorRegion[d.Country_Region].count++;
      if (!costoPorTipoCancer[d.Cancer_Type]) costoPorTipoCancer[d.Cancer_Type] = { total: 0, count: 0 };
      costoPorTipoCancer[d.Cancer_Type].total += parseFloat(d.Treatment_Cost_USD || 0);
      costoPorTipoCancer[d.Cancer_Type].count++;
      if (!factoresRiesgoPorRegion[d.Country_Region]) factoresRiesgoPorRegion[d.Country_Region] = { tabaquismo: 0, alcohol: 0, obesidad: 0, count: 0 };
      factoresRiesgoPorRegion[d.Country_Region].tabaquismo += d.Smoking === 'Sí' ? 1 : 0;
      factoresRiesgoPorRegion[d.Country_Region].alcohol += d.Alcohol_Use === 'Alto' ? 1 : d.Alcohol_Use === 'Moderado' ? 0.5 : 0;
      factoresRiesgoPorRegion[d.Country_Region].obesidad += d.Obesity_Level === 'Alto' ? 1 : d.Obesity_Level === 'Medio' ? 0.5 : 0;
      factoresRiesgoPorRegion[d.Country_Region].count++;
      if (!severidadPorEtapa[d.Cancer_Stage]) severidadPorEtapa[d.Cancer_Stage] = { total: 0, count: 0 };
      severidadPorEtapa[d.Cancer_Stage].total += parseFloat(d.Target_Severity_Score || 0);
      severidadPorEtapa[d.Cancer_Stage].count++;
  });

  const avgSupervivenciaPorAnio = {};
  for (let year in supervivenciaPorAnio) {
      avgSupervivenciaPorAnio[year] = supervivenciaPorAnio[year].total / supervivenciaPorAnio[year].count;
  }
  const avgContaminacionPorRegion = {};
  for (let region in contaminacionPorRegion) {
      avgContaminacionPorRegion[region] = contaminacionPorRegion[region].total / contaminacionPorRegion[region].count;
  }
  const avgCostoPorTipoCancer = {};
  for (let tipo in costoPorTipoCancer) {
      avgCostoPorTipoCancer[tipo] = costoPorTipoCancer[tipo].total / costoPorTipoCancer[tipo].count;
  }
  const avgSeveridadPorEtapa = {};
  for (let etapa in severidadPorEtapa) {
      avgSeveridadPorEtapa[etapa] = severidadPorEtapa[etapa].total / severidadPorEtapa[etapa].count;
  }

  // Colores consistentes
  const colores = [
      '#FF4D4D', '#FF9999', '#FFCCCC', '#FFD9D9', '#FF6666',
      '#FF3333', '#FF0000', '#CC0000', '#990000', '#660000'
  ];

  // 1. Casos por País (Barra)
  new Chart(document.getElementById('casosPorPais'), {
      type: 'bar',
      data: {
          labels: Object.keys(casosPorPais).slice(0, 10), // Limitar a 10 países para evitar estiramiento
          datasets: [{
              label: 'Número de Casos por País',
              data: Object.values(casosPorPais).slice(0, 10),
              backgroundColor: colores[0],
              borderColor: colores[0].replace('0.6', '1'),
              borderWidth: 1
          }]
      },
      options: {
          aspectRatio: 1.5, // Proporción más equilibrada
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Número de Casos' } },
              x: { title: { display: true, text: 'País' } }
          },
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}` } },
              legend: { display: true }
          },
          responsive: true,
          maintainAspectRatio: true // Forzar proporción
      }
  });

  // 2. Distribución por Tipo de Cáncer (Doughnut)
  new Chart(document.getElementById('tipoCancerDoughnut'), {
      type: 'doughnut',
      data: {
          labels: Object.keys(tipoCancerData),
          datasets: [{
              label: 'Tipos de Cáncer',
              data: Object.values(tipoCancerData),
              backgroundColor: colores,
              borderWidth: 1
          }]
      },
      options: {
          aspectRatio: 1, // Proporción circular
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw} casos` } },
              legend: { position: 'right' }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });

  // 3. Casos por Año (Línea)
  new Chart(document.getElementById('casosPorAnio'), {
      type: 'line',
      data: {
          labels: Object.keys(casosPorAnio).sort(),
          datasets: [{
              label: 'Casos por Año',
              data: Object.values(casosPorAnio),
              borderColor: colores[0],
              backgroundColor: colores[0].replace('0.6', '0.2'),
              fill: true,
              tension: 0.3
          }]
      },
      options: {
          aspectRatio: 2, // Proporción más ancha para líneas
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Número de Casos' } },
              x: { title: { display: true, text: 'Año' } }
          },
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}` } },
              legend: { display: true }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });

  // 4. Supervivencia Promedio por Año (Línea)
  new Chart(document.getElementById('supervivenciaPorAnio'), {
      type: 'line',
      data: {
          labels: Object.keys(avgSupervivenciaPorAnio).sort(),
          datasets: [{
              label: 'Supervivencia Promedio (Años)',
              data: Object.values(avgSupervivenciaPorAnio),
              borderColor: colores[1],
              backgroundColor: colores[1].replace('0.6', '0.2'),
              fill: true,
              tension: 0.3
          }]
      },
      options: {
          aspectRatio: 2,
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Años de Supervivencia' } },
              x: { title: { display: true, text: 'Año' } }
          },
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)} años` } },
              legend: { display: true }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });

  // 5. Impacto del Tabaquismo (Barra)
  new Chart(document.getElementById('impactoTabaquismo'), {
      type: 'bar',
      data: {
          labels: Object.keys(tabaquismoData),
          datasets: [{
              label: 'Casos por Tabaquismo',
              data: Object.values(tabaquismoData),
              backgroundColor: colores[2],
              borderColor: colores[2].replace('0.6', '1'),
              borderWidth: 1
          }]
      },
      options: {
          aspectRatio: 1.5,
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Número de Casos' } },
              x: { title: { display: true, text: 'Tabaquismo' } }
          },
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}` } },
              legend: { display: true }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });

  // 6. Distribución por Nivel de Obesidad (Pie)
  new Chart(document.getElementById('nivelObesidadPie'), {
      type: 'pie',
      data: {
          labels: Object.keys(obesidadData),
          datasets: [{
              label: 'Niveles de Obesidad',
              data: Object.values(obesidadData),
              backgroundColor: [colores[0], colores[1], colores[2]],
              borderWidth: 1
          }]
      },
      options: {
          aspectRatio: 1,
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw} casos` } },
              legend: { position: 'right' }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });

  // 7. Consumo de Alcohol por Género (Barra)
  new Chart(document.getElementById('alcoholPorGenero'), {
      type: 'bar',
      data: {
          labels: ['Bajo', 'Moderado', 'Alto'],
          datasets: [
              { label: 'Masculino', data: [alcoholPorGenero.Masculino.Bajo || 0, alcoholPorGenero.Masculino.Moderado || 0, alcoholPorGenero.Masculino.Alto || 0], backgroundColor: colores[0] },
              { label: 'Femenino', data: [alcoholPorGenero.Femenino.Bajo || 0, alcoholPorGenero.Femenino.Moderado || 0, alcoholPorGenero.Femenino.Alto || 0], backgroundColor: colores[1] },
              { label: 'Other', data: [alcoholPorGenero.Other.Bajo || 0, alcoholPorGenero.Other.Moderado || 0, alcoholPorGenero.Other.Alto || 0], backgroundColor: colores[2] }
          ]
      },
      options: {
          aspectRatio: 1.5,
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Número de Casos' } },
              x: { title: { display: true, text: 'Nivel de Consumo de Alcohol' } }
          },
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw}` } },
              legend: { display: true }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });

  // 8. Contaminación del Aire por Región (Barra)
  new Chart(document.getElementById('contaminacionPorRegion'), {
      type: 'bar',
      data: {
          labels: Object.keys(avgContaminacionPorRegion).slice(0, 10), // Limitar a 10 regiones
          datasets: [{
              label: 'Contaminación del Aire Promedio',
              data: Object.values(avgContaminacionPorRegion).slice(0, 10),
              backgroundColor: colores[3],
              borderColor: colores[3].replace('0.6', '1'),
              borderWidth: 1
          }]
      },
      options: {
          aspectRatio: 1.5,
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Nivel de Contaminación' } },
              x: { title: { display: true, text: 'Región' } }
          },
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}` } },
              legend: { display: true }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });

  // 9. Costo del Tratamiento por Tipo de Cáncer (Barra)
  new Chart(document.getElementById('costoPorTipoCancer'), {
      type: 'bar',
      data: {
          labels: Object.keys(avgCostoPorTipoCancer),
          datasets: [{
              label: 'Costo Promedio (USD)',
              data: Object.values(avgCostoPorTipoCancer),
              backgroundColor: colores[4],
              borderColor: colores[4].replace('0.6', '1'),
              borderWidth: 1
          }]
      },
      options: {
          aspectRatio: 1.5,
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Costo (USD)' } },
              x: { title: { display: true, text: 'Tipo de Cáncer' } }
          },
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.raw.toFixed(2)}` } },
              legend: { display: true }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });

  // 10. Severidad por Etapa (Barra)
  new Chart(document.getElementById('severidadPorEtapa'), {
      type: 'bar',
      data: {
          labels: Object.keys(avgSeveridadPorEtapa),
          datasets: [{
              label: 'Severidad Promedio',
              data: Object.values(avgSeveridadPorEtapa),
              backgroundColor: colores[5],
              borderColor: colores[5].replace('0.6', '1'),
              borderWidth: 1
          }]
      },
      options: {
          aspectRatio: 1.5,
          scales: {
              y: { beginAtZero: true, title: { display: true, text: 'Puntuación de Severidad' } },
              x: { title: { display: true, text: 'Etapa del Cáncer' } }
          },
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${ctx.raw.toFixed(1)}` } },
              legend: { display: true }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });

  // 11. Factores de Riesgo por Región (Radar)
  const radarDatasets = Object.keys(factoresRiesgoPorRegion).map((region, index) => ({
      label: region,
      data: [
          factoresRiesgoPorRegion[region].tabaquismo / factoresRiesgoPorRegion[region].count,
          factoresRiesgoPorRegion[region].alcohol / factoresRiesgoPorRegion[region].count,
          factoresRiesgoPorRegion[region].obesidad / factoresRiesgoPorRegion[region].count
      ],
      borderColor: colores[index % colores.length],
      backgroundColor: colores[index % colores.length].replace('0.6', '0.2'),
      fill: true
  }));
  new Chart(document.getElementById('factoresRiesgoRadar'), {
      type: 'radar',
      data: {
          labels: ['Tabaquismo', 'Consumo de Alcohol', 'Obesidad'],
          datasets: radarDatasets
      },
      options: {
          aspectRatio: 1,
          scales: {
              r: { beginAtZero: true, max: 1 }
          },
          plugins: {
              tooltip: { callbacks: { label: ctx => `${ctx.dataset.label}: ${(ctx.raw * 100).toFixed(1)}%` } },
              legend: { position: 'right' }
          },
          responsive: true,
          maintainAspectRatio: true
      }
  });
}
