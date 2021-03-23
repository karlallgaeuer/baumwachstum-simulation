import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { Chart } from 'chart.js';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent{
  // Baumwachstum-Chart-Objekt
  private plotter:Plotter = new Plotter();
  // Simulator-Objekt 
  private simulator:Simulator = new Simulator();
  // Input Map ("baumID": [Startalter, Startzeitpunkt, Standortklasse, Überschirmungsstärke], "laufzeit": [number]) //////////
  private inputMap:Map<string, Array<number>> = new Map<string, Array<number>>();
  // Map mit den Bäumen, bei denen im GUI die Checkbox angeclickt wurde ("id":true)
  private checkboxSelection:Map<string,boolean> = new Map<string,boolean>();
  // Klon der checkboxSelection, die während der Laufzeit der Simulation benutzt wird (-->keine Änderung während Laufzeit möglich)
  // setChecked() wird nämlich immer beim click auf eine Checkbox ausgeführt, es wäre also sonst eine Änderung während der Laufzeit
  // möglich, während aber noch darauf zugegriffen wird
  private checkedMap:Map<string,boolean>;
  // Ergebnis-Array für die Baumhöhe ("id":[3,5,7,8,10,16,19])
  private resultMapBaumhoehe:Map<string,Array<number>>; // = new Map<string,Array<number>>();
  // Ergebnis-Array für die Ableitung ("id":[3,5,7,8,10,16,19])
  private resultMapAbleitung:Map<string,Array<number>>;
  // Iterations-Variable für den Chart-Loop (=1 weil der Plot mit den anfangswerten initialisiert wird bevor der Chart-Loop beginnt)
  private currTimeStep:number = 1;
  // Variable die angibt ob der Chart-Loop gerade läuft oder pausiert
  private chartLoopIsRunning:boolean = false;
  // Chart-Loop-Delay in Millisekunden
  private chartLoopDelay:number;
  // Chart-Loop-Delay (bzw. Simulationsgeschwindigkeit) Userauswahl (wird bei click auf Start in chartLoopDelay kopiert,
  // -->keine Änderung während Laufzeit möglich)(hat nämlich 2-way binding zu html) (default = 120ms delay)
  // (string, damit das Binding funktioniert. Wird für inputMap in number gecastet)
  public selectedSimulationSpeed:string = "120";
  // Ausgewählte Standortklassen (gering = 0, mittel = 1, hoch = 2) (default = 1) (Binding zu Input-Boxen in html)
  // (string, damit das Binding funktioniert. Wird für inputMap in number gecastet)
  public selectedRotbucheStandortklasse:string = "1";
  public selectedFichteStandortklasse:string = "1";
  public selectedSandbirkeStandortklasse:string = "1";
  public selectedWeisstanneStandortklasse:string = "1";
  public selectedKieferStandortklasse:string = "1";
  // Ausgewählte Überschirmungsstärken (schirmfrei = 0, leicht = 1, stark = 2) (default = 0) (Binding zu Input-Boxen in html)
  // (string, damit das Binding funktioniert. Wird für inputMap in number gecastet)
  public selectedRotbucheUeberschirmung:string = "0";
  public selectedFichteUeberschirmung:string = "0";
  public selectedSandbirkeUeberschirmung:string = "0";
  public selectedWeisstanneUeberschirmung:string = "0";
  public selectedKieferUeberschirmung:string = "0";

  constructor() {
    // Checkbox Map initialisieren
    this.checkboxSelection.set('rotbuche', false);
    this.checkboxSelection.set('fichte', false);
    this.checkboxSelection.set('sandbirke', false);
    this.checkboxSelection.set('weisstanne', false);
    this.checkboxSelection.set('kiefer', false);
    // Input Map initialisieren
    this.inputMap.set('rotbuche', []);
    this.inputMap.set('fichte', []);
    this.inputMap.set('sandbirke', []);
    this.inputMap.set('weisstanne', []);
    this.inputMap.set('kiefer', []);
    this.inputMap.set('laufzeit', []);
  }

  // Setzt die Values der Checkboxen in ein Array, falls sie sich ändern
  public setChecked(checkboxEvent:MatCheckboxChange, checkedValue:boolean) : void {
    // Checkbox-Element-Id holen
    let elementId:string = checkboxEvent.source.id;
    // Eintrag dieser id im checkboxSelection-Array auf den ausgewählten Wert setzen
    this.checkboxSelection.set(elementId, checkedValue);
  }

  // Fetcht die Userinput-Values, simuliert das Baumwachstum und speichert die Ergebnisse in ein Array, erstellt 
  // dann den bzw. die Plot-Objekte und Startet bzw. lässt den Chart-Loop weiterlaufen
  public async start() : Promise<void> {
    // Wenn der Timestep am anfang ist und der Chart-Loop nicht läuft --> Chart initialisieren und plotten
    if(this.currTimeStep == 1 && !this.chartLoopIsRunning){
      // Userinput-Values fetchen und in den Instanzvariablen speichern
      let validationState:boolean = this.getInputValues();
      // Wenn die Userinputs nicht validiert werden können --> Funktion abbrechen
      if(!validationState){
        return;
      }
      // Baumwachstum/Ableitung simulieren und in ein Ergebnisarray (Instanzvariable) speichern 
      // (Ausgabe von simulate [resultMapBaumhoehe, resultMapAbleitung])
      [this.resultMapBaumhoehe, this.resultMapAbleitung] = this.simulator.simulate(this.inputMap, this.checkedMap);
      // Baumwachstum-Chart erzeugen (inputMap für die Berechnung von den Altern in den Tooltips übergeben)
      this.plotter.initBaumwachstumPlot(this.resultMapBaumhoehe, this.checkedMap, this.inputMap);
      // Ableitung-Chart erzeugen  (inputMap für die Berechnung von den Altern in den Tooltips übergeben)
      this.plotter.initAbleitungPlot(this.resultMapAbleitung, this.checkedMap, this.inputMap);
      // Speichern, dass der Chart-Loop ab jetzt läuft
      this.chartLoopIsRunning = true;
      // Chart-Loop (n+1, weil der Startpunkt 0 nicht zur Laufzeit zählen soll)
      for(this.currTimeStep; this.currTimeStep<this.inputMap.get("laufzeit")[0]+1; this.currTimeStep++){
        // Den Baumwachstum-Plot updaten
        this.plotter.updateBaumwachstumPlot(this.resultMapBaumhoehe, this.checkedMap, this.currTimeStep);
        // Den Ableitungs-Plot updaten
        this.plotter.updateAbleitungPlot(this.resultMapAbleitung, this.checkedMap, this.currTimeStep);
        // Delay bis der nächste Chart-Punkt animiert wird
        await new Promise(r => setTimeout(r, this.chartLoopDelay));
        // Überprüfen ob der User vielleicht in der Zwischenzeit auf Stop geclickt hat, bevor es in den nächsten Loop-Step geht
        if(!this.chartLoopIsRunning){
          // Return, damit der currTimeStep nicht weiter läuft
          return;
        }
      }
      // Loop vorbei/Laufzeit ist komplett geplottet worden --> timestep zurück auf 1 setzen und chartLoopIsRunning = false setzen
      this.currTimeStep = 1;
      this.chartLoopIsRunning = false;
    }
    // Wenn der Chart-Loop nicht läuft, aber der timestep nicht 1 ist (also Pause) --> Chart-Loop wieder da starten wo er pausiert wurde
    if(this.currTimeStep != 1 && !this.chartLoopIsRunning){
      // Speichern, dass der Chart-Loop ab jetzt wieder läuft
      this.chartLoopIsRunning = true;
      // Chart-Loop (n+1, weil der Startpunkt 0 nicht zur Laufzeit zählen soll)
      for(this.currTimeStep; this.currTimeStep<this.inputMap.get("laufzeit")[0]+1; this.currTimeStep++){
        // Den Baumwachstum-Plot updaten
        this.plotter.updateBaumwachstumPlot(this.resultMapBaumhoehe, this.checkedMap, this.currTimeStep);
        // Den Ableitung-Plot updaten
        this.plotter.updateAbleitungPlot(this.resultMapAbleitung, this.checkedMap, this.currTimeStep);
        // Delay bis der nächste Chart-Punkt animiert wird
        await new Promise(r => setTimeout(r, this.chartLoopDelay));
        // Überprüfen ob der User vielleicht in der Zwischenzeit auf Stop geclickt hat, bevor es in den nächsten Loop-Step geht
        if(!this.chartLoopIsRunning){
          // Return, damit der currTimeStep nicht weiter läuft
          return;
        }
      }
      // Loop vorbei/Laufzeit ist komplett geplottet worden --> timestep zurück auf 1 setzen und chartLoopIsRunning = false setzen
      this.currTimeStep = 1;
      this.chartLoopIsRunning = false;
    }
  }

  // Resettet beide Charts
  public reset() : void {
    // Reset beide Charts
    if(this.plotter.baumwachstumChartExists() && this.plotter.ableitungChartExists()){
      // Chart-Loop anhalten
      this.stop();
      // Timestep zurücksetzen
      this.currTimeStep = 1;
      // Baumwachstums-Chart zerstören
      this.plotter.destroyBaumwachstumChart();
      // Ableitungs-Chart zerstören
      this.plotter.destroyAbleitungChart();
    }
  }

  // Pausiert den Chart Loop (gilt für beide Charts)
  public stop() : void {
    // Charts existieren
    if(this.plotter.baumwachstumChartExists() && this.plotter.ableitungChartExists()){
      // Chart-Loop läuft gerade
      if(this.chartLoopIsRunning){
        this.chartLoopIsRunning = false;
        // Timestep um 1 erhöhen, sonst wird der letzte Wert doppelt geplottet
        this.currTimeStep++;
      }
    }
  }

  // Fetcht die User-Inputs, speichert sie in entsprechenden Instanzvariablen und gibt über einen Boolean an ob die Inputs validiert werden Können
  private getInputValues() : boolean {
    // Rotbuche Startalter, Standortklasse, Startzeitpunkt, Überschirmungsstärke in die Arrays 
    // der Input-Map einfügen (Wenn leergelassen default ist 0)
    this.inputMap.get("rotbuche")[0] = Number((<HTMLInputElement>document.getElementById("rotbucheStartalter")).value);
    this.inputMap.get("rotbuche")[1] = Number((<HTMLInputElement>document.getElementById("rotbucheStartzeitpunkt")).value);
    this.inputMap.get("rotbuche")[2] = Number(this.selectedRotbucheStandortklasse);
    this.inputMap.get("rotbuche")[3] = Number(this.selectedRotbucheUeberschirmung);
    // Fichte Startalter, Standortklasse, Startzeitpunkt, Überschirmungsstärke in die Arrays 
    // der Input-Map einfügen (Wenn leergelassen default ist 0)
    this.inputMap.get("fichte")[0] = Number((<HTMLInputElement>document.getElementById("fichteStartalter")).value);
    this.inputMap.get("fichte")[1] = Number((<HTMLInputElement>document.getElementById("fichteStartzeitpunkt")).value);
    this.inputMap.get("fichte")[2] = Number(this.selectedFichteStandortklasse);
    this.inputMap.get("fichte")[3] = Number(this.selectedFichteUeberschirmung);
    // Sandbirke Startalter, Standortklasse, Startzeitpunkt, Überschirmungsstärke
    // in die Arrays der Input-Map einfügen (Wenn leergelassen default ist 0)
    this.inputMap.get("sandbirke")[0] = Number((<HTMLInputElement>document.getElementById("sandbirkeStartalter")).value);
    this.inputMap.get("sandbirke")[1] = Number((<HTMLInputElement>document.getElementById("sandbirkeStartzeitpunkt")).value);
    this.inputMap.get("sandbirke")[2] = Number(this.selectedSandbirkeStandortklasse);
    this.inputMap.get("sandbirke")[3] = Number(this.selectedSandbirkeUeberschirmung);
    // Weisstanne Startalter, Standortklasse, Startzeitpunkt, Überschirmungsstärke
    // in die Arrays der Input-Map einfügen (Wenn leergelassen default ist 0)
    this.inputMap.get("weisstanne")[0] = Number((<HTMLInputElement>document.getElementById("weisstanneStartalter")).value);
    this.inputMap.get("weisstanne")[1] = Number((<HTMLInputElement>document.getElementById("weisstanneStartzeitpunkt")).value);
    this.inputMap.get("weisstanne")[2] = Number(this.selectedWeisstanneStandortklasse);
    this.inputMap.get("weisstanne")[3] = Number(this.selectedWeisstanneUeberschirmung);
    // Kiefer Startalter, Standortklasse, Startzeitpunkt, Überschirmungsstärke
    // in die Arrays der Input-Map einfügen (Wenn leergelassen default ist 0)
    this.inputMap.get("kiefer")[0] = Number((<HTMLInputElement>document.getElementById("kieferStartalter")).value);
    this.inputMap.get("kiefer")[1] = Number((<HTMLInputElement>document.getElementById("kieferStartzeitpunkt")).value);
    this.inputMap.get("kiefer")[2] = Number(this.selectedKieferStandortklasse);
    this.inputMap.get("kiefer")[3] = Number(this.selectedKieferUeberschirmung);
    // Laufzeit in das Array der Input-Map einfügen
    this.inputMap.get("laufzeit")[0] = Number((<HTMLInputElement>document.getElementById("laufzeit")).value);
    // Checkbox-Input-Map klonen und speichern
    this.checkedMap = cloneDeep(this.checkboxSelection);
    // Chart-Loop-Delay (Simulationsgeschwindigkeit) abfragen und speichern
    this.chartLoopDelay = Number(this.selectedSimulationSpeed);
    // Inputs validieren
    let validationState:boolean = this.validateInputValues();
    // Ausgeben ob Validierung true oder false
    return validationState;
  }

  // Überprüft ob die Nutzereingaben Sinn machen
  private validateInputValues() : boolean {
    // Ausgewählte Bäume mit counter durchgehen, falls 0 ausgewählt sind --> return false
    let checkedCounter:number = 0;
    for(const [currBaum, checked] of this.checkedMap.entries()){
      if(checked){
        checkedCounter++;
      }
    }
    if(checkedCounter == 0){
      window.alert("Es muss mindestens eine Baumart ausgewählt sein, um die Simulation zu starten.");
      return false;
    }
    // Es werden nur Startalter, Startzeitpunkt und die Simulationslaufzeit überprüft
    // Die anderen Eingaben sind keine freien Texteingaben, hier sind keine falschen Eingaben möglich
    for(const [currBaum, checked] of this.checkedMap.entries()){
      if(checked){
        // Startalter
        if( (this.inputMap.get(currBaum)[0] < 0) || (this.inputMap.get(currBaum)[0] > 1000) ){
          window.alert("Das Startalter muss zwischen 0 und 1000 Jahren liegen.");
          return false;
        }
        // Startzeitpunkt
        if( (this.inputMap.get(currBaum)[1] < 0) || (this.inputMap.get(currBaum)[1] > 1000) ){
          window.alert("Der Startzeitpunkt muss zwischen 0 und 1000 Jahren liegen.");
          return false;
        }
        // Simulationslaufzeit
        if( (this.inputMap.get("laufzeit")[0] <= 0) || (this.inputMap.get("laufzeit")[0] > 2000) ){
          window.alert("Die Simulationszeit muss mindestens 1 Jahr und darf maximal 2000 Jahre betragen.");
          return false;
        }
        // Startzeitpunkt muss kleiner sein als Simulationslaufzeit
        if( this.inputMap.get(currBaum)[1] >= this.inputMap.get("laufzeit")[0] ){
          window.alert("Der Startzeitpunkt muss kleiner als die Simulationslaufzeit sein.");
          return false;
        }
      }
    }
    return true;
  }

  // Event um nur die Ziffern 0-9 als Eingabe zu erlauben
  public numberOnly(event): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
      return false;
    }
    return true;
  }

}

// Plotter Klasse
class Plotter {
  // Chart für das Baumwachstum
  private baumwachstumChart:Chart;
  // Chart für die Ableitung
  private ableitungChart:Chart;
  // Farben für die Bäume im Chart in einer Map speichern
  private colorMap:Map<string,string> = new Map<string,string>();
  // Styles für die Linien Arten in den Charts
  private dashedMap:Map<string, Array<number>> = new Map<string, Array<number>>();

  constructor() {
    // Color-Map befüllen
    this.colorMap.set('rotbuche', 'rgba(230, 159, 0, 1)');
    this.colorMap.set('fichte', 'rgba(0, 158, 115, 1)');
    this.colorMap.set('sandbirke', 'rgba(213, 94, 0, 1)');
    this.colorMap.set('weisstanne', 'rgba(86, 180, 233, 1)');
    this.colorMap.set('kiefer', 'rgba(210, 200, 88, 1)');
    //this.colorMap.set('kiefer', 'rgba(236, 181, 217, 1)');
    // Dashed-Map befüllen
    this.dashedMap.set('rotbuche', []);
    this.dashedMap.set('fichte', [20, 4]);
    this.dashedMap.set('sandbirke', [10, 4, 3, 4]);
    this.dashedMap.set('weisstanne', [6, 6]);
    this.dashedMap.set('kiefer', [3, 2]);
  }

  // Gibt aus ob ein Baumwachstums-Chart existiert
  public baumwachstumChartExists() : boolean {
    if(typeof this.baumwachstumChart !== 'undefined'){
      return true;
    }else{
      return false;
    }
  }

  // Gibt aus ob ein Ableitungs-Chart existiert
  public ableitungChartExists() : boolean {
    if(typeof this.ableitungChart !== 'undefined'){
      return true;
    }else{
      return false;
    }
  }

  // Zerstört den Baumwachstums-Chart
  public destroyBaumwachstumChart() : void {
    // Falls der Chart existiert
    if(typeof this.baumwachstumChart !== 'undefined'){
      // Chart zerstören und dann undefined setzen
      this.baumwachstumChart.destroy();
      this.baumwachstumChart = undefined;
    }
  }

  // Zerstört den Ableitungs-Chart
  public destroyAbleitungChart() : void {
    // Falls der Chart existiert
    if(typeof this.ableitungChart !== 'undefined'){
      // Chart zerstören und dann undefined setzen
      this.ableitungChart.destroy();
      this.ableitungChart = undefined;
    }
  }

  // Baumwachstum-Plot initialisieren
  public initBaumwachstumPlot(valueMap:Map<string,Array<number>>, checkedMap:Map<string,boolean>, inputMap:Map<string, Array<number>>) : void {
    // Vorherigen Chart zerstören falls es einen gibt (sonst gibt es den Bug, dass beim drüber hovern manchmal der alte Chart angezeigt wird)
    if(typeof this.baumwachstumChart != "undefined"){
      this.baumwachstumChart.destroy();
    }
    // Datasets für die Chart in einem Loop der über die checkedMap iteriert festlegen
    let dataSetArray = [];
    for(const [currBaum, checked] of checkedMap.entries()){
      // Wenn der Baum ausgewählt wurde
      if(checked){
        // Datenset befüllen
        let dataset = {
          label: currBaum.charAt(0).toUpperCase() + currBaum.slice(1), // currBaum-Label (Erster Buchstabe --> gross schreiben)
          data: [valueMap.get(currBaum)[0]], // Erster Wert der Baumhöhe
          fill: false, // Hintergrund nicht befüllen
          borderColor: [this.colorMap.get(currBaum)], // Line-Color
          borderDash: this.dashedMap.get(currBaum), // Line-Style
          backgroundColor: this.colorMap.get(currBaum),
          borderWidth: 2
        };
        // Datenset in das Array pushen
        dataSetArray.push(dataset);
      }
    }
    // Html-Element an das der Chart gehängt werden soll
    var ctx = document.getElementById('baumwachstumChart') as HTMLCanvasElement;
    // Chart erzeugen
    this.baumwachstumChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: [0], // Start-Label ist immer 0, weil die Zeit des Charts immer bei x=0 anfangen soll
          datasets: dataSetArray
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero: true
                  },
                  scaleLabel: {
                    display: true,
                    fontSize: 17,
                    labelString: "Baumhöhe in [m]"
                }
              }],
              xAxes: [{
                ticks: {
                  beginAtZero: true
                },
                scaleLabel: {
                  display: true,
                  fontSize: 17,
                  labelString: "Zeit in [J]"
                }
              }]
          },
        animation: {
          duration: 0 // Animation --> aus
        },
        elements: {
          point:{
              pointStyle: "line", // Eigentlich überflüssig, weil borderColor = transparent
              hitRadius: 5, // Hover-Radius für den Tooltip
              borderColor: 'rgba(0, 0, 0, 0)' // Transparente Punkte
          }
        },
        title: {
          display: true,
          text: 'Höhenwachstum',
          fontSize: 20
        },
        tooltips: {
          mode: 'label',
          callbacks: { // Callbacks = Custom tooltips
            title: function(tooltipItems, data) {
              let jahr:String = String(tooltipItems[0].index); // Index 0 für Dataset 0 (x-Axe ist für alle Datasets gleich)
              return "Jahr: " + jahr;
            },
            label: function(tooltipItems, data) {
              //tooltipItems = Bäume auf dem Tooltip der angezeigt werden soll
              //tooltipItems.datasetIndex = Die jeweiligen Indizes des Datensatzes
              // Baumname
              let baumLabel:string = data.datasets[tooltipItems.datasetIndex].label + ": ";
              // Baumhöhe
              let baumHoehe:string = "Höhe: " + String(Math.round(Number(tooltipItems.yLabel) * 100) / 100) + "m, ";
              // Baumalter
              // toLowerCase(), weil die Chart-Labels am Anfang gross geschrieben sind
              let startalter:number = inputMap.get(data.datasets[tooltipItems.datasetIndex].label.toLowerCase())[0];
              let startzeitpunkt:number = inputMap.get(data.datasets[tooltipItems.datasetIndex].label.toLowerCase())[1];
              // Baumalter = Aktuelles Jahr + Startalter - Startzeitpunkt
              let baumAlter:string = "Alter: " + String(Number(tooltipItems.label) + startalter - startzeitpunkt) + " Jahre";
              return baumLabel + baumHoehe + baumAlter;
            }
          },
          // Tooltip nach der Baumhöhe sortieren
          itemSort: function(a, b) {
            return Number(b.yLabel) - Number(a.yLabel);
          },  
        },
        responsive: true, // Chart passt sich dem Container an
        maintainAspectRatio: false
      }
  });
  }

  // Ableitungs-Plot initialisieren
  public initAbleitungPlot(valueMap:Map<string,Array<number>>, checkedMap:Map<string,boolean>, inputMap:Map<string, Array<number>>) : void {
    // Vorherigen Chart zerstören falls es einen gibt (sonst gibt es den Bug, dass beim drüber hovern manchmal der alte Chart angezeigt wird)
    if(typeof this.ableitungChart != "undefined"){
      this.ableitungChart.destroy();
    }
    // Datasets für die Chart in einem Loop der über die checkedMap iteriert festlegen
    let dataSetArray = [];
    for(const [currBaum, checked] of checkedMap.entries()){
      // Wenn der Baum ausgewählt wurde
      if(checked){
        // Datenset befüllen
        let dataset = {
          label: currBaum.charAt(0).toUpperCase() + currBaum.slice(1), // currBaum-Label (Erster Buchstabe --> gross schreiben)
          data: [valueMap.get(currBaum)[0]], // Erster Wert der Baumhöhe
          fill: false, // Hintergrund nicht befüllen
          borderColor: [this.colorMap.get(currBaum)], // Line-Color
          borderDash: this.dashedMap.get(currBaum), // Line-Style
          backgroundColor:this.colorMap.get(currBaum),
          borderWidth: 2
        };
        // Datenset in das Array pushen
        dataSetArray.push(dataset);
      }
    }
    // Html-Element an das der Chart gehängt werden soll
    var ctx = document.getElementById('ableitungChart') as HTMLCanvasElement;
    // Chart erzeugen
    this.ableitungChart = new Chart(ctx, {
      type: 'line',
      data: {
          labels: [0], // Start-Label ist immer 0, weil die Zeit des Charts immer bei x=0 anfangen soll
          datasets: dataSetArray
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero: true
                  },
                  scaleLabel: {
                    display: true,
                    fontSize: 17,
                    labelString: "Zuwachs der Baumhöhe in [m/J]"
                }
              }],
              xAxes: [{
                ticks: {
                  beginAtZero: true
                },
                scaleLabel: {
                  display: true,
                  fontSize: 17,
                  labelString: "Zeit in [J]"
                }
              }]
          },
        animation: {
          duration: 0 // Animation --> aus
        },
        elements: {
          point:{
              pointStyle: "line",
              borderColor: 'rgba(0, 0, 0, 0)',
              hitRadius: 5
          }
        },
        title: {
          display: true,
          text: 'Höhenzuwachs (= Ableitung)',
          fontSize: 20
        },
        tooltips: {
          mode: 'label',
          callbacks: { // Callbacks = Custom tooltips
            title: function(tooltipItems, data) {
              let jahr:String = String(tooltipItems[0].index); // Index 0 für Dataset 0 (x-Axe ist für alle Datasets gleich)
              return "Jahr: " + jahr;
            },
            label: function(tooltipItems, data) {
              // Baumname
              let baumLabel:string = data.datasets[tooltipItems.datasetIndex].label + ": ";
              // Baumhöhe
              let baumHoehe:string = "Höhenzuwachs: " + String(Math.round(Number(tooltipItems.yLabel) * 100) / 100) + "m/J, ";
              // Baumalter
              // toLowerCase(), weil die Chart-Labels am Anfang gross geschrieben sind
              let startalter:number = inputMap.get(data.datasets[tooltipItems.datasetIndex].label.toLowerCase())[0];
              let startzeitpunkt:number = inputMap.get(data.datasets[tooltipItems.datasetIndex].label.toLowerCase())[1];
              // Baumalter = Aktuelles Jahr + Startalter - Startzeitpunkt
              let baumAlter:string = "Alter: " + String(Number(tooltipItems.label) + startalter - startzeitpunkt) + " Jahre";
              return baumLabel + baumHoehe + baumAlter;
            }
          }, // Tooltip nach den Höhenzuwachswerten sortieren
          itemSort: function(a, b) {
            return Number(b.yLabel) - Number(a.yLabel);
          },
        },
        responsive: true,
        maintainAspectRatio: false
      }
  });
  }

  // Baumwachstum-Plot updaten
  public updateBaumwachstumPlot(valueMap:Map<string,Array<number>>, checkedMap:Map<string,boolean>, currTimeStep:number) : void {
    // Bei jedem Update x-Label um 1 erhöhen
    this.baumwachstumChart.data.labels.push(Number(this.baumwachstumChart.data.labels[this.baumwachstumChart.data.labels.length -1]) + 1);
    // Durch die checkedMap iterieren (i, damit die weiteren Bäume in datatset[1], bzw. dataset[2] usw. gepusht werden)
    let i = 0;
    for(const [currBaum, checked] of checkedMap.entries()){
      // Falls der Baum ausgewählt wurde
      if(checked){
        this.baumwachstumChart.data.datasets[i].data.push(valueMap.get(currBaum)[currTimeStep]);
        i++;
      }
    }
    // Chart-Objekt updaten
    this.baumwachstumChart.update();
  }

  // Ableitungs-Plot updaten
  public updateAbleitungPlot(valueMap:Map<string,Array<number>>, checkedMap:Map<string,boolean>, currTimeStep:number) : void {
    // Bei jedem Update x-Label um 1 erhöhen
    this.ableitungChart.data.labels.push(Number(this.ableitungChart.data.labels[this.ableitungChart.data.labels.length -1]) + 1);
    // Durch die checkedMap iterieren (i, damit die weiteren Bäume in datatset[1], bzw. dataset[2] usw. gepusht werden)
    let i = 0;
    for(const [currBaum, checked] of checkedMap.entries()){
      // Falls der Baum ausgewählt wurde
      if(checked){
        this.ableitungChart.data.datasets[i].data.push(valueMap.get(currBaum)[currTimeStep]);
        i++;
      }
    }
    // Chart-Objekt updaten
    this.ableitungChart.update();
  }
}



// Simulator-Klasse um das Baumwachstum zu simulieren
class Simulator {
  // Unterschiedliche Koeffizienten für die Mitscherlichfunktion je nach Standortklasse (gering = 0, mittel = 1, hoch = 2)
  private standortKoeffs:Map<string,Array<number>> = new Map<string,Array<number>>();
  // Unterschiedliche Überschirmungsfaktoren je nach ausgewählter Überschirmungsstärke (schirmfrei = 0, leicht = 1, stark = 2)
  private ueberschirmungFaktoren:Map<string,number> = new Map<string,number>();

  // Konstruktor
  constructor() {
    // Rotbuche Standort Koeffizienten
    this.standortKoeffs.set("rotbuche0", [28.2355428034188, 0.0257633813885726, 3.13176443619910]);
    this.standortKoeffs.set("rotbuche1", [39.3789006177155, 0.0201099653448618, 1.82130187817793]);
    this.standortKoeffs.set("rotbuche2", [50.3072578634555, 0.0174526901128224, 1.42068135194711]);

    // Eiche Standort Koeffizienten
    //this.standortKoeffs.set("eiche0", [25.7571976926906, 0.0199865098036924, 1.77409117620523]);
    //this.standortKoeffs.set("eiche1", [34.6367764728183, 0.0117369528693247, 0.799387936482062]);
    //this.standortKoeffs.set("eiche2", [77.0942772860058, 0.00100261882096798, 0.385088661998837]);

    // Fichte Standort Koeffizienten
    this.standortKoeffs.set("fichte0", [31.5944827210935, 0.0233921609854750, 2.39909322916341]);
    this.standortKoeffs.set("fichte1", [39.2075346638196, 0.0232253437031505, 1.59555456104405]);
    this.standortKoeffs.set("fichte2", [45.5830042348998, 0.0231715511077725, 1.31690519045313]);

    // Bergahorn Standort Koeffizienten
    //this.standortKoeffs.set("bergahorn0", [26.2874659016826, 0.0242502561553752, 0.986702850641474]);
    //this.standortKoeffs.set("bergahorn1", [34.0208027749976, 0.0240748417490472, 0.981500701500911]);
    //this.standortKoeffs.set("bergahorn2", [44.2340861547668, 0.0135802692321533, 0.609559039257599]);

    // Sandbirke Standort Koeffizienten
    this.standortKoeffs.set("sandbirke0", [20.2771282959546, 0.0492129975457813, 1.55641631453242]);
    this.standortKoeffs.set("sandbirke1", [26.3490580441204, 0.0499476426391511, 1.59296185527322]);
    this.standortKoeffs.set("sandbirke2", [32.3788704279779, 0.0508194626628435, 1.62775201164761]);

    // Weisstanne Standort Koeffizienten
    this.standortKoeffs.set("weisstanne0", [29.9923060176791, 0.0202208448381131, 2.56391585165356]);
    this.standortKoeffs.set("weisstanne1", [39.3764126013770, 0.0168297944849527, 1.72352062384551]);
    this.standortKoeffs.set("weisstanne2", [48.1585262244144, 0.0148021904693024, 1.35958130703217]);

    // Kiefer Standort Koeffizienten
    this.standortKoeffs.set("kiefer0", [21.9, 0.027, 1.75]);
    this.standortKoeffs.set("kiefer1", [29.71, 0.029, 1.75]);
    this.standortKoeffs.set("kiefer2", [37.27, 0.03, 1.75]);

    // Überschirmungskoeffizienten (schirmfrei = 0, leicht = 1, stark = 2)
    // Rotbuche Überschirmungskoeffizienten
    this.ueberschirmungFaktoren.set("rotbuche0", 1);
    this.ueberschirmungFaktoren.set("rotbuche1", 0.75);
    this.ueberschirmungFaktoren.set("rotbuche2", 0.5);

    // Fichte Überschirmungskoeffizienten
    this.ueberschirmungFaktoren.set("fichte0", 1);
    this.ueberschirmungFaktoren.set("fichte1", 0.6);
    this.ueberschirmungFaktoren.set("fichte2", 0.3);

    // Sandbirke Überschirmungskoeffizienten
    this.ueberschirmungFaktoren.set("sandbirke0", 1);
    this.ueberschirmungFaktoren.set("sandbirke1", 0.5);
    this.ueberschirmungFaktoren.set("sandbirke2", 0.1);

    // Weisstanne Überschirmungskoeffizienten
    this.ueberschirmungFaktoren.set("weisstanne0", 1);
    this.ueberschirmungFaktoren.set("weisstanne1", 0.9);
    this.ueberschirmungFaktoren.set("weisstanne2", 0.75);

    // Kiefer Überschirmungskoeffizienten
    this.ueberschirmungFaktoren.set("kiefer0", 1);
    this.ueberschirmungFaktoren.set("kiefer1", 0.8);
    this.ueberschirmungFaktoren.set("kiefer2", 0.4);
  }

  // Baumwachstum simulieren 
  // Inputs: inputMap, checkedMap
  // Outputs: [resultMapBaumhoehe, resultMapAbleitung]
  public simulate(inputMap:Map<string, Array<number>>, checkedMap:Map<string,boolean>) : [Map<string, Array<number>> , Map<string, Array<number>>]{
    // Laufzeit in Jahren aus inputMap
    let n:number = inputMap.get("laufzeit")[0];
    // resultMapBaumhoehe initialisieren
    let resultMapBaumhoehe:Map<string,Array<number>> = new Map<string,Array<number>>();
    // resultMapAbleitung initialisieren
    let resultMapAbleitung:Map<string,Array<number>> = new Map<string,Array<number>>();
    
    // Für die ausgewählten Bäume simulieren (über die checkedMap iterieren)
    for(const [currBaum, checked] of checkedMap.entries()){
      // Wenn der Baum ausgewählt wurde
      if(checked){
        // Alter des Baumes auf das Startalter setzen
        let currAlter:number = inputMap.get(currBaum)[0];
        // Startzeitpunkt des Baumes abfragen
        let currStartzeitpunkt:number = inputMap.get(currBaum)[1];
        // Standortklasse des Baumes abfragen
        let currStandortklasse:number = inputMap.get(currBaum)[2];
        // Überschirmungsstärke-Auswahl des Baumes abfragen
        let currUeberschirmung:number = inputMap.get(currBaum)[3];
        // resultMapBaumhoehe mit Array initialisieren
        resultMapBaumhoehe.set(currBaum, []);
        // resultMapAbleitung mit Array initialisieren
        resultMapAbleitung.set(currBaum, []);
        // Simulationsloop (Alter des Baumes in currAlter gespeichert und geht erst hoch,
        // sobald der Startzeitpunkt dieses Baumes erreicht ist. Die gesamte Laufzeit wird mit i iteriert
        // n+1, weil der Startpunkt 0 nicht zur Laufzeit zählen soll
        for(let i=0;i<n+1;i++){
          // Startzeitpunkt wurde erreicht
          if(i >= currStartzeitpunkt){
            // Koeffizienten des aktuellen Baumes abfragen
            let b1:number = this.standortKoeffs.get(currBaum + String(currStandortklasse))[0];
            let b2:number = this.standortKoeffs.get(currBaum + String(currStandortklasse))[1];
            let b3:number = this.standortKoeffs.get(currBaum + String(currStandortklasse))[2];
            //Überschirmungsfaktor für die Auswahl der Überschirmungsstärke für diesen Baum abfragen
            let ueberschirmung:number = this.ueberschirmungFaktoren.get(currBaum + String(currUeberschirmung));
            // Nächsten Höhenwert berechnen (Funktion nach Chapman-Richards mit eingesetzten Koeffizienten)
            let baumhoeheNext:number = (b1*(1-Math.exp(-b2*currAlter))**b3) * ueberschirmung;
            // Nächsten Ableitungswert berechnen (Funktion nach Chapman-Richards, abgeleitet mit eingesetzten Koeffizienten)
            let ableitungNext:number = (b1*b2*b3*ueberschirmung) * Math.exp((-b2*currAlter)) * (1-Math.exp(-b2*currAlter))**(b3-1);
            // Ergebnis-Werte speichern
            resultMapBaumhoehe.get(currBaum).push(baumhoeheNext);
            resultMapAbleitung.get(currBaum).push(ableitungNext);
            // Alter des Baumes um 1 Jahr erhöhen
            currAlter++;
          }else{ // Startzeitpunkt noch nicht erreicht
            // Null-Wert als Ergebnis abspeichern
            resultMapBaumhoehe.get(currBaum).push(null);
            resultMapAbleitung.get(currBaum).push(null);
          }
        }
      }
    }
    return [resultMapBaumhoehe, resultMapAbleitung];
  }
}

