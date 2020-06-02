var app = new Vue({
    el: "#app",
    data: {
        etat: 'accueil',
        datacop: [],
        nbRepVrai: 0,
        nbRepFausses: 0,
        nbRepMax: 0,
        moyenne: 0,
        tabRep: [],
        themechoix: "",
        // Variable d'état de l'application.
        // Peut prendre les valeurs : 'accueil', 'chargement', 'info', 'jeu', 'resultats', 'correction', 'fin'.
        // Elle détermine ce qui doit être affiché ou pas (voir le template)

        stats: {loc: {}, theme: {}, glob : {} }, // différentes contextes de stats

        // pour les bonus:
        combo: 0, // barre de combo : nb de réponses correctes depuis la dernière faute
        bonus: {total:0,liste:[],html:""}, // infos sur les bonus

        nbQuestions: 1, // nb de questions à afficher dans chaque partie
        data: [], // le pointeur vers l'objet courant contenant les questions, 
        themes: [], // le tableau qui contient les thèmes
        t: {"nom":"","info":"","data":[]}, // le thème choisi
        c: "loc", // contexte actuel d'affichage de stats, peut aussi valoir "theme"

        liste: [], // longueur nbQuestions, la liste des numéros des questions posées à chaque partie
        resultatsLoc: [] // longueur idem, valeurs 1, 0 ou -1 suivant le résultat 
    
    },
    methods:{
        demarrage: function(){
	
            for(var c in stats) { // initialisation
               // reinitialiser(stats[c]);
            }
            // --- FONT-AWESOME
              $("head").append($("<link rel='stylesheet' href='https://maxcdn.bootstrapcdn.com/font-awesome/4.3.0/css/font-awesome.min.css' type='text/css' media='screen' />"));
            // --- MATHJAX
            $('#accueil').append('<span id="secret" style="visibility:hidden">Test MathJax: $\\int_{\\mathbb R} e^{-x^2} dx = \\sqrt\\pi$.<br></span>'); // formule mathématique invisible
            actualiserMathJax(); //chargement et rendu du test invisible
            // --- compteur (masqué) :
            $('#secret').append('<img src="compteur.php" width="2" height="2">');
        },
        choisirTheme: function(nom){ // lorsqu'on clique sur un thème dans le menu
            nbQuestions=1; // si ça a changé à la fin du thème précédent
            //if(themes[nom]==undefined){// le thème n'est pas encore chargé
                etat="chargement";
              //  actualiserAffichage(); // afficher l'écran de chargement
                $.get('data/' + nom + '.json', function (d) {
                    // création et affectation d'un objet 'theme' vide:
                    themes[nom]= {"nom":nom, "info":"", "data":{}};
                    if($.type(d[0]) === "string")
                        themes[nom].info=d.splice(0,1);
                    themes[nom].data=d;//remplissage avec les données:
                    demarrerTheme(nom);
                },"json"); //getJSON ne marche pas, pb de callback  ?... 
                
            //} else {// le thème est déjà chargé
             //   demarrerTheme(nom);
           // }
        },
        demarrerTheme: function(nom){
            themechoix = nom;
            t = JSON.parse(JSON.stringify(themes[nom])); //duplication du thème
            data=t.data; //data contient les données
            datacop = data;
            nbRepMax = 0;
            for (let index = 0; index < data.length; index++) {
                for (let k = 0; k < data[index].answers.length; k++) {
                    nbRepMax++
                }
            }
            console.log("Le thème "+nom+" contient "+data.length+" questions");
            liste=[]; // nettoyer la liste d'un éventuel thème précédent
           // reinitialiser(stats['theme']);
            if(t.info!=""){
                etat="info";
               // actualiserAffichage();
               // actualiserMathJax(); // au cas où il y a des maths dans un exemple ou dans les consignes
            }else{
               // nouvellePartie();
            }
        }
        
        
    }
})
