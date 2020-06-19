var app = new Vue({
    el: "#app",
    data: {
        // Variable de themes
        datacop: [],
        themechoix: "",
        copthemes: [],

        // Pour le chrono total du QCM
        debut:{},
        fin:{},
        temps:0,
        minute:0,
        
        // pour les résultats
        nbRepVrai: 0,
        nbRepFausses: 0,
        nbRepMax: 0,
        moyenne: 0,
       

        

        nbQuestions: 1, // nb de questions à afficher dans chaque partie
        data: [], // le pointeur vers l'objet courant contenant les questions, 
        themes: [], //le tableau qui contient les thèmes


        liste: [], // longueur nbQuestions, la liste des numéros des questions posées à chaque partie

        // Boolean pour l'affichage de la page
        acc: true,
        resultat: false,
        jeu : false,


        // Variable pour le bonus temps
        tempstot : 0,
        sp : document.getElementsByClassName("ChronoBonusTemps"),
        s : 0,
        mn : 0,
        interval : 0,
        bonusTemps:0
    },
    methods:{
        demarrage: function(){
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
                app.actualiserAffichage(false, false, false); // afficher l'écran de chargement
                $.get('data/' + nom + '.json', function (d) {
                    // création et affectation d'un objet 'theme' vide:
                    var themeobj = new Object();
                    themeobj.nom = nom;
                    themeobj.info = "";
                    themeobj.data = {};
                    this.themes = [themeobj];
                    if($.type(d[0]) === "string"){
                        this.themes[0].info=d.splice(0,1);
                    }
                    this.themes[0].data=d;//remplissage avec les données:
                    app.demarrerTheme(nom, this.themes[0]);
                },"json"); //getJSON ne marche pas, pb de callback  ?... 
            } else {// le thème est déjà chargé
               app.demarrerTheme(nom, this.themes[0]);
            }
    },
        demarrerTheme: function(nom, themes){
            this.themechoix = nom;
            this.datacop = themes.data;
            this.nbRepMax = 0;
            for (let index = 0; index < themes.data.length; index++) {
                for (let k = 0; k < themes.data[index].answers.length; k++) {
                    this.nbRepMax++
                }
            }
            console.log("Le thème "+nom+" contient "+themes.data.length+" questions");
            this.liste=[]; // nettoyer la liste d'un éventuel thème précédent
            app.reinitialiser();
            this.debut=new Date();
            if(themes.info!=""){
                app.actualiserAffichage(false, false, false);
                app.actualiserMathJax(); // au cas où il y a des maths dans un exemple ou dans les consignes
            }else{
                app.nouvellePartie(themes);
            }
        },
        nouvellePartie: function(themes){
            this.copthemes = themes;
            // On enlève les réponses et la question précédente
            $(".card").remove();
            $(".question").empty();
            // choisir les questions restantes de cette partie dans le thème
            this.liste=app.sousListe(this.nbQuestions,themes.data.length); 
            console.log('il reste '+themes.data.length+'questions.');
            // Calcul du temps bonus pour la question
            app.tempsQuest(this.copthemes);
            var quest=$('#tr-modele').insertAfter('#tr-modele').toggle(true);
            // Affichage de la question
            $('.question').append(themes.data[this.liste[0]].question);
            if(themes.data[this.liste[0]].comment != undefined){
                quest.find('.commentaire').html(themes.data[this.liste[0]].comment);
            } else{
                quest.find('.affichageCommentaire').remove();
            }
            //quest.find('input').attr('name','q'+0);
            //quest.find("*[id]").andSelf().each(function() { $(this).attr("id", $(this).attr("id") + 0); });
            var rep ='';
            var textrep = '';
            for (let index = 0; index < themes.data[this.liste[0]].answers.length; index++) {
                textrep = ' ' + themes.data[this.liste[0]].answers[index].value
                rep = rep + '<div class="card card-'+index+'" style="min-width: 100%;"><label><input class="secondary-content" style="opacity:100" type="checkbox" id="rep'+ index +'" onclick="app.select('+index+')"><div class="card-body" id="' + index + '" ><text style="color:black;">' + textrep + '</text></div></label></div>' ;
            }
            $( ".card-flex" ).append(rep);
            app.actualiserAffichage(false, true, false);
            app.actualiserMathJax();
            app.startInterval();
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
            // Boolean qui permet d'afficher l'écran d'accueil / de jeu / de résultat
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
        select: function(index){
            if( $('#rep'+index).is(':checked') ){
                $('.card-'+index).addClass("teal lighten-5");
                $('.card-'+index).addClass("z-depth-4");
            }else{
                $('.card-'+index).removeClass("teal lighten-5");
                $('.card-'+index).removeClass("z-depth-4");
            }
        },
        reinitialiser: function(){
            this.nbRepVrai = 0;
            this.nbRepFausses = 0;
            this.moyenne = 0;
            this.bonusTemps=0;
        },
        redemarrerTheme: function(){
            app.choisirTheme(this.themechoix);
        },
        calculresultat: function(){
            this.moyenne = (((this.nbRepVrai + this.bonusTemps) - this.nbRepFausses) / this.nbRepMax) * 20; 
            this.moyenne = Math.round(this.moyenne);
            if (this.moyenne < 0) {
                this.moyenne = 0;
            }
            if(this.moyenne > 20){
                this.moyenne = 20;
            }
        },
        resultats: function(){
            clearInterval(this.interval);
            // On regarde si les cases cochées sont les bonnes
            var bonneRepConsecutive = true;
            for (let index = 0; index < this.copthemes.data[this.liste[0]].answers.length; index++) {
                if (this.copthemes.data[this.liste[0]].answers[index].correct){
                    if ($('#rep'+index).is(':checked')){
                        this.nbRepVrai++;
                    }else{
                        bonneRepConsecutive = false;
                        this.nbRepFausses++;
                    }
                }else{
                    if ($('#rep'+index).is(':checked')) {
                        bonneRepConsecutive = false;
                        this.nbRepFausses++;
                    }else{
                        this.nbRepVrai++;
                    }
                }
            }
            // On enlève la question déjà posé
            this.copthemes.data.splice(this.liste[0], 1);
            //Si le temps n'est pas écoulé et que la réposne est bonne : bonusTemps+1
            if (this.tempstot > 0 && bonneRepConsecutive) {
                this.bonusTemps += 1;
            }
            // Si il n'y a plus de question on passe au résultat
            if (this.copthemes.data.length == 0){
                this.fin = new Date();
                this.temps = Math.floor((this.fin-this.debut)/1000);
                if(this.temps >= 60){
                    this.minute = Math.floor(this.temps/60); 
                }
                app.calculresultat();
                app.actualiserAffichage(false, false, true);
            // Sinon on lance la prochaine question
            }else{
                app.nouvellePartie(this.copthemes);
            }
        },
        tempsQuest : function(copthemes){
            // Temps pour lire la question
            this.tempstot = 10;
            // Temps en plus pour chaque réponse
            for (let index = 0; index < copthemes.data[this.liste[0]].answers.length; index++) {
                this.tempstot = this.tempstot + 5; 
            }
        },
        update_chrono: function(){
            if (this.tempstot == 0 && this.mn == 0) {
                this.sp[0].innerHTML = "Délai écoulé pour le bonus temps..";
                this.sp[1].innerHTML="";
                clearInterval(this.interval);
            }else{
                this.tempstot = this.tempstot - 1;
                if(this.tempstot==0 && this.mn > 0){
                    this.tempstot=60;
                    this.mn = this.mn - 1;
                }
                this.sp[0].innerHTML="Temps restant pour obtenir le bonus temps pour cette question : "+this.mn+" min";
                this.sp[1].innerHTML=this.tempstot+" s";
            }
        },
        startInterval: function () {
            this.interval = setInterval(() => {app.update_chrono()}, 1000);
        }   
    }  
})
