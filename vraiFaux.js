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
        themes: [], //le tableau qui contient les thèmes
        t: {"nom":"","info":"","data":[]}, // le thème choisi
        c: "loc", // contexte actuel d'affichage de stats, peut aussi valoir "theme"

        liste: [], // longueur nbQuestions, la liste des numéros des questions posées à chaque partie
        resultatsLoc: [], // longueur idem, valeurs 1, 0 ou -1 suivant le résultat 
        acc: true,
        copthemes: [],
        resultat: false,
        jeu : false
    },
    methods:{
        demarrage: function(){
	
            for(var c in stats) { // initialisation
                app.reinitialiser(this.stats[c]);
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
            this.moyenne=0;
            this.nbRepVrai=0;
            this.nbRepFausses=0;
            this.nbRepMax=0;
            this.nbQuestions=1; // si ça a changé à la fin du thème précédent
            if(this.themes[0]==undefined){// le thème n'est pas encore chargé
                this.etat="chargement";
                app.actualiserAffichage(false, false, false); // afficher l'écran de chargement
                $.get('data/' + nom + '.json', function (d) {
                    // création et affectation d'un objet 'theme' vide:
                    var themeobj = new Object();
                    themeobj.nom = nom;
                    themeobj.info = "";
                    themeobj.data = {};
                    this.themes = [themeobj];
                    if($.type(d[0]) === "string")
                        this.themes[0].info=d.splice(0,1);
                    this.themes[0].data=d;//remplissage avec les données:
                    app.demarrerTheme(nom, this.themes[0]);
                },"json"); //getJSON ne marche pas, pb de callback  ?... 
                
            } else {// le thème est déjà chargé
               app.demarrerTheme(nom, this.themes[0]);
            }
    },
        demarrerTheme: function(nom, themes){
            this.themechoix = nom;
            // t = JSON.parse(JSON.stringify(this.themes[nom])); //duplication du thème
            // data=t.data; //data contient les données
            this.datacop = themes.data;
            this.nbRepMax = 0;
            for (let index = 0; index < themes.data.length; index++) {
                for (let k = 0; k < themes.data[index].answers.length; k++) {
                    this.nbRepMax++
                }
            }
            console.log("Le thème "+nom+" contient "+themes.data.length+" questions");
            this.liste=[]; // nettoyer la liste d'un éventuel thème précédent
            app.reinitialiser(this.stats['theme']);
            if(themes.info!=""){
                this.etat="info";
                app.actualiserAffichage(false, false, false);
                app.actualiserMathJax(); // au cas où il y a des maths dans un exemple ou dans les consignes
            }else{
                app.nouvellePartie(themes);
            }
        },
        nouvellePartie: function(themes){
            this.copthemes = themes;
            $(".card").remove();
            $(".question").empty();
            
                
            //c="loc";
            this.liste=app.sousListe(this.nbQuestions,themes.data.length); // choisir les questions de cette partie dans le thème
            console.log('il reste '+themes.data.length+'questions. Choix : '+this.liste);
            
            //$('#vf tr').each(function(){ if($(this).attr('id')!='tr-modele') $(this).remove();}); // vide tout sauf le modèle
            
            var quest=$('#tr-modele').insertAfter('#tr-modele').toggle(true);
           
            //quest.find('.question').html(themes.data[this.liste[0]].question); // lier du latex ne passe pas bien avec l'eval
            //quest.find('.question').append(themes.data[this.liste[0]].question);
            $('.question').append(themes.data[this.liste[0]].question);
            if(themes.data[this.liste[0]].comment != undefined){
                quest.find('.commentaire').html(themes.data[this.liste[0]].comment);
            } else{
                quest.find('.affichageCommentaire').remove();
            }
            quest.find('input').attr('name','q'+0);
            quest.find("*[id]").andSelf().each(function() { $(this).attr("id", $(this).attr("id") + 0); });
                
        
            this.etat="jeu";
            var rep ='';
            var textrep = '';
            for (let index = 0; index < themes.data[this.liste[0]].answers.length; index++) {
                textrep = ' ' + themes.data[this.liste[0]].answers[index].value
                //var info = (typeof data[liste[0]].type == 'undefined' ? 'checkbox' : 'radio');
                rep = rep + '<div class="card card-'+index+'" style="min-width: 100%;"><label><input class="secondary-content" style="opacity:100" type="checkbox" id="rep'+ index +'" onclick="app.test('+index+')"><div class="card-body" id="' + index + '" ><text style="color:black;">' + textrep + '</text></div></label></div>' ;
            }
            $( ".card-flex" ).append(rep);
            
            app.actualiserAffichage(false, true, false);
            app.actualiserMathJax();
        },
        sousListe: function(a,b){
            // retourne un tableau de longueur a
            //contenant des nombres entre 0 et b-1 différents
            // (ordonnés aléatoirement)
            var r=[]; //tableau à retourner
            var tab=[]; //tableau contenant les nombres de 0 à b dans l'ordre.
            for(var i=0;i<b;i++){
                tab[i]=i;
            }
            while(r.length<a){
                r.push(tab.splice(Math.floor(Math.random()*tab.length),1)[0]);
            }
            return r;
        },
        actualiserAffichage: function(acc, jeu, resultat){
            this.acc = acc;
            this.jeu = jeu;
            this.resultat = resultat;
        },
        actualiserMathJax: function(){
            if(typeof(MathJax)!= 'undefined') {// si MathJax est chargé, on relance le rendu
                MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
            } else { // sinon, on le recharge et on relance le rendu en callback
                $.getScript('https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML', function() {
                MathJax.Hub.Queue(["Typeset", MathJax.Hub]);
                });
            }
        },
        actualiserStats: function(){

        },
        test: function(index){
            if( $('#rep'+index).is(':checked') ){
                $('.card-'+index).addClass("teal lighten-5");
                $('.card-'+index).addClass("z-depth-4");
            }else{
                $('.card-'+index).removeClass("teal lighten-5");
                $('.card-'+index).removeClass("z-depth-4");
            }
        },
        reinitialiser: function(pp){
            pp.debut=new Date();
            pp.repJustes=0;
            pp.repFausses=0;
            pp.repNeutres=0;
            pp.rep=0;
            pp.note=0;
            pp.points=0;
            pp.temps=0;
            pp.efficacite=0;
            nbRepVrai = 0;
            nbRepFausses = 0;
            moyenne = 0;
            tabRep = [];
    
    },
    redemarrerTheme: function(){
        app.choisirTheme(this.themechoix);
    },
    calculresultat: function(){
        this.moyenne = ((this.nbRepVrai - this.nbRepFausses) / this.nbRepMax) * 20; 
        this.moyenne = Math.round(this.moyenne);
        if (this.moyenne < 0) {
            this.moyenne = 0;
        }
    },
    resultats: function(){
        
        for (let index = 0; index < this.copthemes.data[this.liste[0]].answers.length; index++) {
            if( $('#rep'+index).is(':checked') ){
                this.tabRep.push('#rep'+index)
            }
        }
        for (let index = 0; index < this.copthemes.data[this.liste[0]].answers.length; index++) {
            if (this.copthemes.data[this.liste[0]].answers[index].correct){
                if ($('#rep'+index).is(':checked')){
                    this.nbRepVrai++;
                }else{
                    this.nbRepFausses++;
                }
            }else{
                if ($('#rep'+index).is(':checked')) {
                    this.nbRepFausses++;
                }else{
                    this.nbRepVrai++;
                }
            }
        }
        console.log(this.nbRepVrai, this.nbRepFausses);
        console.log(this.moyenne);
        app.calculresultat();

    
    
        this.copthemes.data.splice(this.liste[0], 1);
        this.etat="resultats";
        this.resultatsLoc=[];
    
        //app.actualiserStats();
        //app.actualiserBonus();
        if (this.copthemes.data.length == 0){
            app.actualiserAffichage(false, false, true);
        }else{
            app.nouvellePartie(this.copthemes);
        }
    }
        
        
    }
})
