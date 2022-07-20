$('#morning, #night').click(function() {
    GetHorarios();
});

$('#criteris input').change(function() {
    GetHorarios(false);
});

$('#limit input').change(function() {
    GetHorarios();
});

$('#list_quadri').select2({
    placeholder: "Selecciona un quadrimestre"
});

$('#list_pla').select2({
    placeholder: "Selecciona un pla"
});

$('#seleccionar-dia-lliure').select2({
    placeholder: "Selecciona un pla"
});

$('#Refresh_Button').click(function(e){
    e.preventDefault(); 
    get_places();
    GetHorarios();
})

function actualitzarAules() {
	if ($('#mostrar-aules').is(':checked')) {
		$('.aules').show();
	} else {
		$('.aules').hide();
	}
}

function actualitzarOcupacio() {
    if ($('#mostrar-ocupacio').is(':checked')) {
        $('.ocupacio').show();
    } else {
        $('.ocupacio').hide();
    }
}

$('#mostrar-aules').click(function() {
	actualitzarAules();
});

$('#mostrar-ocupacio').click(function() {
    actualitzarOcupacio();
});

$('#diferenciar-teoria-de-practica').click(function() {
    GetHorarios();
});
$('#ocultar-sense-places').click(function() {
    GetHorarios();
});

var assigs = new Array(); //Conjunto de asignaturas en el grado

var assigs_filtrat = new Array();

var franjes = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00",
    "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00"
];
var horaris_assig = new Array();
var client_id = '9NYy9WxhUhNtISqa4hGS45fnDsTSoXIp33ZuAsnc';
var morning;
var night;
var party; //Dia festiu
var dif_teoria; //Diferent teoria a labs
var def_horaris;
var places;
var list_quadri = new Array();
var list_pla = new Array();
var control_grups;
var limit;
var sense_places;
 
function getAssigs()
{
    var quadri = list_quadri[$('#list_quadri').val()];
    var url = 'https://api.fib.upc.edu/v2/quadrimestres/' + quadri.id + '/assignatures/?client_id=' +
        self.client_id;

    jQuery.getJSON(url, function(json)
    {
        assigs = json.results.sort();
        //limpiarasignaturas();
        assigs.length = json.count;
        get_pla();
    })
};

function setListContainer(){

    var cr = document.getElementById('listcontainer');
    for (var i = 0; i < assigs_filtrat.length; ++i)
    {
        var cd = document.createElement('option');
        cd.value = i;
        cd.innerHTML = assigs_filtrat[i];
        cr.appendChild(cd);
    }
    $('#listcontainer').prop("disabled", false);
};


// Despres de fixar el quadri, calculem les places lliures
function get_places() {
    $('#mostrar-ocupacio').prop("disabled", true);
    var url = 'https://api.fib.upc.edu/v2/assignatures/places/?pla=GRAU&client_id=' + self.client_id;
    jQuery.getJSON(url, function(json)
    {
        var res = json.results;
        places = {};
        $.each(res, function(i, assig) {
            if(assig.grup.slice(-1) == 'P'){
               assig.grup = assig.grup.substring(0,assig.grup.length-1)
            }
            places[assig.assig + "_" + assig.grup] = {lliures: assig.places_lliures, totals: assig.places_totals};
        });
        
        $('#mostrar-ocupacio').prop("disabled", false);
    })
}



function get_pla()
{

    var url = 'https://api.fib.upc.edu/v2/plans_estudi.json?client_id=' + self.client_id;
    jQuery.getJSON(url, function(json)
    {
        var aux2 = json.results;
        var quadri = new Array();
        var check = false;
        for (var i = 0; i < aux2.length; ++i)
        {           
                list_pla.push(aux2[i]);  
        }

        var j = 0;
        var cr = document.getElementById('list_pla')

        for (var i = 0; i < list_pla.length; ++i)
        {
            var item = {
                value: i,
                text: list_pla[i].abreviatura
            }
            $('#list_pla').append($('<option>', item
            ));
            if(list_pla[i].abreviatura == 'GRAU')$("#list_pla").val(i).trigger({
               type: "select2:select",
               params: {
                   data: item
               }
            
            });
        }
        get_places();
    })

}


function get_quadri()
{

    var url = 'https://api.fib.upc.edu/v2/quadrimestres.json?client_id=' + self.client_id;
    jQuery.getJSON(url, function(json)
    {
        var aux2 = json.results;
        var quadri = new Array();
        var check = false;
        for (var i = 0; i < aux2.length; ++i)
        {
            if (aux2[i].actual_horaris == 'S') {
                check = true;
            }
            if (check) {
                list_quadri.push(aux2[i]);
            }
        }

        var j = 0;
        var cr = document.getElementById('list_quadri')

        for (var i = 0; i < list_quadri.length; ++i)
        {
            $('#list_quadri').append($('<option>',
            {
                value: i,
                text: list_quadri[i].id
            }));
        }
        getAssigs();
       
       
    })
}
get_quadri();




$('#listcontainer').select2();
$('#listcontainer').on('select2:select', function(evt)
{
    var quadri = list_quadri[$('#list_quadri').val()];

    var url = 'https://api.fib.upc.edu/v2/quadrimestres/' + quadri.id + '/classes/?client_id=' + self
        .client_id + '&codi_assig=' + evt.params.data.text;

    jQuery.getJSON(url, function(json)
    {
        var prov = json.results;
        prov.sort(sortFuncAssig);
        horaris_assig.push(prov);
        GetHorarios();
    })

})

// Modificacio d'assignatures
$('#listcontainer').on('select2:unselect', function(evt) {
        for (var i = 0; i < horaris_assig.length; ++i)
        {
            if (horaris_assig[i].length > 0 && horaris_assig[i][0].codi_assig == evt.params.data.text)
            {
                horaris_assig.splice(i, 1);
            }
        }
        GetHorarios();
    }
)

$('#list_quadri').on('select2:select', function(evt)
{
	$('#listcontainer').prop("disabled", true);
    $('#listcontainer').html('');
    horaris_assig = new Array();
    $('#horari, #selector_horari').hide();
    getAssigs();
  //  limpiarasignaturas($('#list_pla').val());
    setListContainer();

})



$('#list_pla').on('select2:select', function(evt)
{
	$('#listcontainer').prop("disabled", true);
    $('#listcontainer').html('');
    horaris_assig = new Array();
    $('#horari, #selector_horari').hide();
    var pla = evt.params.data.text
    limpiarasignaturas(pla);
    setListContainer();

})



function sortFuncAssig(a, b)
{
    return parseInt(a.grup) - parseInt(b.grup)
}

function limpiarasignaturas(filtre) // MEJORAR ALGUN DIA (NEVER)
{
    assigs_filtrat= $.extend(true,[],assigs); 
   // assigs_filtrat = assigs;
    for (var i = 0; i < assigs_filtrat.length; ++i)
    {
        if(filtre == "GRAU"){
            if (assigs_filtrat[i].search("MEI") != -1 || assigs_filtrat[i].search("MIRI") != -1 || assigs_filtrat[i].search("GCED") != -1 || 
            assigs_filtrat[i].search("MAI") != -1 || assigs_filtrat[i].search("GBIO") != -1   || assigs_filtrat[i].search("IT4BI") != -1  || 
            assigs_filtrat[i].search("BDMA") != -1 || assigs_filtrat[i].search("FP") != -1 || assigs_filtrat[i].search("MMC") != -1 || 
            assigs_filtrat[i] == ("MENTORIES") || assigs_filtrat[i].search("TEC") != -1 || assigs_filtrat[i] == "EXAMENS" || 
            assigs_filtrat[i] == 'RESERVAT' ||  assigs_filtrat[i].search("MPAL") != -1 || assigs_filtrat[i] == 'TANCAT' || assigs_filtrat[i].search('AL-') != -1)
            {

                assigs_filtrat.splice(i, 1);
                --i;

            };
        }
        else{
            if(assigs_filtrat[i].search(filtre) == -1){

             assigs_filtrat.splice(i,1);
             --i;
                }
            }

    }
}

function RefreshList()
{
    for (var i = 0; i < assigs_filtrat.length; ++i)
    {
        $('#listcontainer').append($('<option>',
        {
            value: i,
            text: assigs_filtrat[i]
        }));
    }
}

//RefreshList();

function GetHorarios(quieres_recalcular = true)
{

    $('#error_msg').html("")
    $('#horari, #selector_horari').show();
    var assigs = $('#listcontainer').val();

    if (assigs.length == 0) {
    	$('#error_msg').html("Configura el teu horari desitjat.");
        $('#horari, #selector_horari').hide();
        return;
    }

    if (assigs.length > 6)
    {
        $('#error_msg').html("No pots agafar m&eacute;s de 6 assignatures");
        $('#horari, #selector_horari').hide();
        return;
    }

    morning      = document.getElementById('morning').checked;
    night        = document.getElementById('night').checked;
    dif_teoria   = document.getElementById('diferenciar-teoria-de-practica').checked;
    party        = parseInt(document.getElementById('seleccionar-dia-lliure').value);
    limit        = parseInt(document.getElementById('limit').value);
	sense_places = document.getElementById('ocultar-sense-places').checked;

    if (!morning && !night)
    {
        $('#error_msg').html('Escull mat&iacute; i/o tardes.');
        $('#horari, #selector_horari').hide();
        return;
    }
    control_grups = new Array(0);
    control_grups.length= 0;
    var checkhorari = new Array(5);
    checkhorari.length = 5;
    if (quieres_recalcular) {
        def_horaris = new Array();
        for (var i = 0; i < 5; ++i)
        {
            checkhorari[i] = new Array(13);
            checkhorari.length = 13;
            for (var j = 0; j < checkhorari[i].length; ++j)
            {
                checkhorari[i][j] = null;
            }

        }
        deeply(0, horaris_assig, checkhorari, def_horaris)
    }

    $.each(def_horaris, function(i, horari){
        horari.puntuacio = importancia(horari.horari,horari.grups);
    });

    // Vale, ordeno, pero antes asigno puntuaciones
    var check = 0
    $('#criteris input').each(function(i,inp){
        check += $(inp).val();
        }
    )
    if(check != 0)def_horaris.sort(function(a, b) {
        return b.puntuacio - a.puntuacio
    })

    if (def_horaris.length == 0) {
        $('#error_msg').html('No s\'ha pogut trobar ningun horari sense solapaments.');
    }

    HtmlChanger(def_horaris);

    if (def_horaris.length == 0) {
        $('#horari, #selector_horari').hide();
    } else if (def_horaris.length == 1) {
    	$('#error_msg').html("S'ha trobat 1 horari.");
    } else {
    	$('#error_msg').html("S'han trobat " + def_horaris.length + " horaris.");
    }
}

function HtmlChanger(mat)
{
    $('#label_horari').on("change", function() {
        change_horario(this.value - 1);
    })

    /*
    $('#label_horari').html("");

    for (var i = 0; i < mat.length; ++i)
    {
        $('#label_horari').append($('<option>',
        {
            value: i,
            text: i+1
        }));
    }
    */

    $('#label_horari').attr("max", mat.length);
    $('#label_horari').val(1);

    $('#total_horaris').text(mat.length);
    if (mat.length >= 1) change_horario(0);
}

function checkifisalone(horari_assig)
{
    for (var i = 0; i < horari_assig.length; ++i)
    {
        if (horari_assig[i].grup % 10 != 0) return false;
    }
    return true;
}
function checkifisonlylabs(horari_assig)
{
    for (var i = 0; i < horari_assig.length; ++i)
    {
        if (horari_assig[i].grup % 10 == 0) return false;
    }
    return true;
}

function addToHorari(horari_assig, checkhorari, group)
{

    for (var i = 0; i < horari_assig.length; ++i)
    {

        var grup = parseInt(horari_assig[i].grup);

        if (grup == group)
        {

            var hora = franjes.indexOf(horari_assig[i].inici);
            var dia = horari_assig[i].dia_setmana - 1;

            if ((checkhorari[dia][hora] != null) || (horari_assig[i].durada >= 2 && checkhorari[dia][hora+1] != null) || (horari_assig[i].durada == 3 && checkhorari[dia][hora+2] != null) || (dia == party))
            {
                return false;
            }

            for (var j = 0; j < horari_assig[i].durada; ++j)
            {

                var c = jQuery.extend(true,
                {}, horari_assig[i]);
                var aux = parseInt(franjes[hora]) + j;
                if (aux < 10)
                {
                    c.inici = '0' + aux + ':00';
                }
                else
                {
                    c.inici = aux + ':00';
                }
                c.durada = 1;
                checkhorari[dia][hora + j] = c; /// EL PROBLEMA ESTA AQUI TODOS COMPARTEN MISMO DESTINO DUNNOW WHY;
            }
        }

    }
    return true;

}
/*
Pre: checkhorari és un horari valid
Post: a checkhorari se l'ha afegit el subgrup de la materia seleccionada, retornant cert si es pot afegir. Retorna fals en cas contrari.
*/
function removeToHorari(horari_assig, checkhorari, group)
{

    for (var i = 0; i < horari_assig.length; ++i)
    {

        var grup = parseInt(horari_assig[i].grup);
        if (grup == group)
        {
            var hora = franjes.indexOf(horari_assig[i].inici);
            var dia = horari_assig[i].dia_setmana - 1;

            for (var j = 0; j < horari_assig[i].durada; ++j)
            {

                if (checkhorari[dia][hora + j] != null && checkhorari[dia][hora + j].codi_assig ==
                    horari_assig[i].codi_assig)
                {
                    checkhorari[dia][hora + j] = null;
                }
            }
        }

    } /// 42      42 - 42%10
}
/*
Pre: checkhorari és un horari valid
Post: a checkhorari se l'ha subtret el subgrup de la materia seleccionada
*/

// Valor de la asignatura, horarios de esa asignatura, valor de la tabla
function deeply(mat, horaris_assig, checkhorari)
{
    
    if (def_horaris.length == limit) return;
    if (mat > horaris_assig.length - 1)
    {
      //  var aux4 = jQuery.extend(true,{},control_grups);
        var aux4 = control_grups.slice();
        var aux3 = jQuery.extend(true, {}, checkhorari); //Solucionar
      //  var aux3 = checkhorari.slice();
        def_horaris.push({puntuacio: 0, horari: aux3, grups:aux4});
        return;
    }
    var group = -1;
    var isalone = checkifisalone(horaris_assig[mat]);

    for (var i = 0; i < horaris_assig[mat].length; ++i)
    {
        
        if ((horaris_assig[mat][i].grup%10 == 0 && !isalone) || horaris_assig[mat][i].grup <= group)
            continue;

        var hora = parseInt(horaris_assig[mat][i].inici.substr(0, 2));
        var dia = parseInt(horaris_assig[mat][i].dia_setmana);

        if ((hora < 14 && !morning) || (hora >= 14 && !night)) continue;
		if (sense_places) {
			var id_places = horaris_assig[mat][0].codi_assig + "_" + horaris_assig[mat][i].grup;
			if (places[id_places].lliures == 0) continue;
		}

        group = parseInt(horaris_assig[mat][i].grup);
        control_grups.push( horaris_assig[mat][i].codi_assig + '_' + group);

        
        if (!dif_teoria || checkifisonlylabs(horaris_assig[mat]))
        {
            var check = addToHorari(horaris_assig[mat], checkhorari, group) && addToHorari(horaris_assig[mat], checkhorari, group - group%10);
            if (check) deeply(mat + 1, horaris_assig, checkhorari);

            removeToHorari(horaris_assig[mat], checkhorari, group);
            removeToHorari(horaris_assig[mat], checkhorari, group - group%10);
            control_grups.pop();
        }
        else
        {
            var group_t = -1;
            for (var j = 0; j < horaris_assig[mat].length; ++j)
            {
                if ((horaris_assig[mat][j].grup%10 != 0) || horaris_assig[mat][j].grup <= group_t) continue;
                
                var hora = parseInt(horaris_assig[mat][j].inici.substr(0, 2));
                if ((hora < 14 && !morning) || (hora >= 14 && !night)) continue;
		        /*if (sense_places) {
			        var id_places = horaris_assig[mat][0].codi_assig + "_" + horaris_assig[mat][j].grup;
			        if (places[id_places].lliures == 0) continue;
		        }*/

                group_t = parseInt(horaris_assig[mat][j].grup);

                var check = addToHorari(horaris_assig[mat], checkhorari, group) && addToHorari(horaris_assig[mat], checkhorari, group_t);
                if (check) deeply(mat + 1, horaris_assig, checkhorari);

                removeToHorari(horaris_assig[mat], checkhorari, group);
                removeToHorari(horaris_assig[mat], checkhorari, group_t);
                control_grups.pop();
            }
        }
        
        
    }
    return;
}

function importancia(horario,grups) {
    // NUMERO DE HORAS MUERTAS
    var importancia = 0;
    
    // La importancia de un horario es producto de factores por calidad del factor
    // La calidad de cada factor es un numero entre 0 y 1

    // CRITERIO DE HORAS MUERTAS
    var crit_mortes = 0;
    if ($('#crit_mortes').val() > 0) {
        var muertas = 0;
        $.each(horario, function(i, dia) {
            var n = dia.length;
            var primera_hora_ocupada = 0;
            while (primera_hora_ocupada < n && dia[primera_hora_ocupada] == null) ++primera_hora_ocupada;
            // Haz un continue; si el dia esta libre
            if (primera_hora_ocupada == 13) {
                return true;
            }
            var ultima_hora_ocupada = 12;
            while (ultima_hora_ocupada >= 0 && dia[ultima_hora_ocupada] == null) --ultima_hora_ocupada;

            // Miramos en el rango cuantas estan muertas
            for (var w = primera_hora_ocupada; w <= ultima_hora_ocupada; ++w) {
                if (dia[w] == null) ++muertas;
            }
        })
        // Como mucho toleramos 4 horas muertas
        if (muertas > 4) muertas = 4;
        if (muertas == 0) {
            crit_mortes = 1;
        } else {
            crit_mortes = 0.5 - (muertas / 4) * 0.5;
        }
    }

    // CRITERIO DE LUNES TARDE
    var crit_dill_tard = 0;
    if ($('#crit_dill_tard').val() > 0) {
        var dilluns = horario[0];
        var classe_8 = horario[0][0];
        var classe_9 = horario[0][1];
        if (classe_8 == null && classe_9 == null) crit_dill_tard = 1;
        else if (classe_8 == null && classe_9 != null) crit_dill_tard = 0.5;
        else crit_dill_tard = 0;
    }

    // CRITERIO DE SDÃ§
    // Calculamos la desviacion tipica del numero de horas por dia
    // y le aplicamos la inversa. Muchos numeros sacados de aqui se han hecho
    // a ojo
    var crit_sd = 0;
    if ($('#crit_sd').val() > 0) {
        var dias = new Array();
        $.each(horario, function(i, dia) {
            var cuantas_horas_hoy = 0;
            for (var j = 0; j < 13; ++j) {
                if (dia[j] != null) ++cuantas_horas_hoy;
            }
            if (cuantas_horas_hoy != 0)
            dias.push(cuantas_horas_hoy);
        })
        var n = dias.length;
        var sum = 0;
        var sq_sum = 0;
        for(var w = 0; w < n; ++w) {
           sum += dias[w];
           sq_sum += dias[w] * dias[w];
        }
        var mean = sum / n;
        var variance = sq_sum / n - mean * mean;
        crit_sd = 1/variance;
        if (crit_sd > 6) crit_sd = 6;
        crit_sd /= 6;
    }
    //Emptyness bruh
    var crit_empty = 0;
    if($('#crit_empty').val() > 0){

        var materias = grups.length;
        var valoracion = 0
        $.each(grups,function(i,groups){

            ocupacio = places[groups].lliures / places[groups].totals;
         //   console.log(ocupacio/materias)
            ocupacio /= materias;


            valoracion +=ocupacio;
       //     console.log(valoracion);

        })

        crit_empty = valoracion;

    }


    var crit_party = 0;

    if ($('#crit_party').val() > 0) {

        $.each(horario, function(i, dia) {

            for(var j = 0; j < 13;j++){

                if(dia[j] != null)return true;

            }
            crit_party = 1;
        })

    }

    importancia =
      Math.pow(2, $('#crit_mortes').val()) * crit_mortes +
      Math.pow(2, $('#crit_dill_tard').val()) * crit_dill_tard +
      Math.pow(2, $('#crit_sd').val()) * crit_sd +
      Math.pow(2, $('#crit_empty').val()) * crit_empty +
      Math.pow(2, $('#crit_party').val()) * crit_party;

    return importancia;
}

function change_horario(il)
{
    //console.log(def_horaris[il].grups);
    new Graella(def_horaris[il].horari, def_horaris[il].puntuacio,def_horaris[il].grups);
}

////////////////////////////////////////////////////////////////////////////////////////

function Graella(horari, puntuacio, grups, comentaris)
{
    var self = this
    self.element = "#horari"
    self.horari = horari
    self.puntuacio = puntuacio
    self.pla = "GRAU"
    self.comentaris = comentaris
    self.lang = "ca"
    self.grups = grups;
    var DIES_SETMANA = {
        "ca": ['Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte', 'Diumenge'],
        "es": ['Lunes', 'Martes', 'Mi&eacute;rcoles', 'Jueves', 'Viernes', 'SÃƒÆ’Ã‚Â¡bado', 'Domingo'],
        "en": ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    }
    var DIES_SETMANA_REDUIT = {
        "ca": ['dl.', 'dt.', 'dc.', 'dj.', 'dv.']
    }
    var VEURE_AULES = {
        "ca": "Veure les aules",
        "es": "Ver las aulas",
        "en": "Display classrooms"
    }
    init()

    function string2color(str)
    {
        var hash = 5381;
        for (var i = 0; i < str.length; ++i)
        {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
        }

        var x = Math.sin(hash) * 10000;
        x = (0xFFFFFF * (x - Math.floor(x))) | 0;

        var col = (new Number(x)).toString(16);
        while (col.length < 6) col = "0" + col;
        return "#" + col;
    }

    function blackOverColor(bg)
    {
        /**
         * Get whether a text should be black or white over a given background color.
         * @param {string} bg - A color, as a HTML hexadecimal value
         * @returns {boolean} True if the text is better off black
         */
        var r = parseInt(bg.substr(1, 2), 16)
        var g = parseInt(bg.substr(3, 2), 16)
        var b = parseInt(bg.substr(5, 2), 16)
        return 0.213 * r + 0.715 * g + 0.072 * b > 127
    }

    function getStyle(str)
    {
        var bgcolor = string2color(str)
        var color = blackOverColor(bgcolor) ? 'black' : 'white'
        return 'style="padding:2px;background-color: ' + bgcolor + '; color: ' + color + '"'
    }

    function netejaHorari()
    {
        var taula = jQuery(self.element + " table tbody");
        taula.html("");
        for (var hora = 8; hora <= 20; ++hora)
        {
            var tr = jQuery("<tr>");
            taula.append(tr);
            tr.append('<th class="hora">' + hora + "-" + (hora + 1) + "<span class='hidden-xs'>h</span></th>");
            for (dia = 1; dia <= 5; ++dia)
            {
                tr.append('<td class="d' + dia + 'h' + hora + '"></td>');
            }
        }
    }

    function displayHorari()
    {
      //  $('#pun').html(importancia(horari,grups))
        jQuery(self.element + " table td div").remove()
        if (horari == null) return;
        for (var i = 0; i < 5; ++i)
        {
            for (var j = 0; j < 13; ++j)
            {
                var c = horari[i][j];
                if (c == null) continue;
                var hora = parseInt(c.inici.substr(0, 2))

                var casella = jQuery(self.element + " .d" + c.dia_setmana + "h" + (hora))
                var assig = c.codi_assig
                if (self.pla != undefined) assig = assig.replace('-' + self.pla, '')
                var text = '<div ' + getStyle(c.codi_assig) + '>';
                text += assig + " " + c.grup;
                text += " <span class='hidden-xs'>" + c.tipus + '</span>';
                text += '<span class="ocupacio">' + descripcio_aules(assig, c.grup) + '</span>';
                text += '<span class="aules"><br>' + c.aules + '</span>';
                text += '</div>';
                casella.html(text)

            }
        }
        actualitzarAules();
        actualitzarOcupacio();
    }

    function descripcio_aules(codi_assig, grup)
    {
        var identificador = codi_assig + "_" + grup;
        var places_assig = places[identificador];
        if (places_assig == undefined) {
            return "";
        } else {
            return "<br>(" + places_assig.lliures + "/" + places_assig.totals + ")";
        }
    }

    function displayComentaris()
    {
        jQuery(self.element + " .comentaris-horaris li").remove();
        for (var i in self.comentaris)
        {
            var c = self.comentaris[i]
            jQuery(self.element + " .comentaris-horaris").append('<li>' + c.comentari + '</li>')
        };
    }

    function llistaDies(tag, dies)
    {
        var text = "";
        for (var i = 0; i < dies; ++i)
        {
            text += '<' + tag + '>' + "<span class='visible-xs'>" + DIES_SETMANA_REDUIT[self.lang][i] + "</span>"
            + "<span class='hidden-xs'>" + DIES_SETMANA[self.lang][i] + "</span>"+ '</' + tag + '>';
        }
        return text;
    }

    function init()
    {
        // Si la tabla no existe, la creamos
        if($("#tabla-horari").length == 0) {
            html =
                '<table class="table table-striped table-bordered table-condensed horari" id="tabla-horari">' +
                '   <thead>' +
                '       <tr><th></th>' + llistaDies('th', 5) + '</tr>' +
                '   </thead>' +
                '   <tbody>' +
                '   </tbody>' +
                '</table>' +
                '<ul class="comentaris-horaris"></ul>';
            $(self.element).html(html);
        }

        // Si la tabla no tiene body, se lo creamos
        if ($('#tabla-horari tbody').children().length == 0) {
            netejaHorari()
        }
        displayHorari()
        displayComentaris()
    }
}

$(document).keydown(function(e) {
  //  console.log("hey");
    var LEFT = 37;
    var RIGHT = 39;
    var t = e.which;
    var input = $('#label_horari');
    var cuanto = input.val();
    //Retroceder
    if (t == LEFT) {
        if (cuanto != 1)
        input.val(--cuanto);
    }
    // Avanzar
    else if (t == RIGHT) {
        if (cuanto != input.attr('max'))
        input.val(++cuanto);
    }
    input.trigger("change");
});

GetHorarios();
