# Visualisierung des Höhenwachstums von Bäumen
## Demo: https://karlallgaeuer.github.io/baumwachstum-simulation/

Das Projekt wurde erstellt mit [Angular CLI](https://github.com/angular/angular-cli) (Version 10.2.0).

Die Höhenentwicklung wurde nachberechnet mit einem exponentiellen Modell nach Chapman-Richards (1959):

h= b1*(1-exp(-b2*t))**b3                                                               (1)

ih= (b1*b2*b3)*exp((-b2*t)*(1-exp(-b2*t)**(b3-1)                                       (1a)

mit h=Höhe(t), ih=Höhenzuwachs, t=Zeit (syn. Alter[Jahre]), b1-b3 Koeffizienten.

In der Web-Applikation "Visualisierung des Höhenwachstums von Bäumen" kann die Höhenentwicklung bedingt wählbar simuliert werden: Baumart, Alter, Startzeitpunkt, Standort, Überschirmung lassen sich einstellen. Die Sandbirke ist eine Pionierbaumart, (Rot-) Buche und (Weiß-) Tanne entsprechen typischen Klimaxbaumarten, während die Fichte als intermediär klassifiziert werden kann.

Die Auswahl der Bäume erfolgt über das Setzen eines Hakens. Zusätzlich lassen sich jeweils pro Baum (ausgeschlossen Simulationslaufzeit, Simulationsgeschwindigkeit) weitere Parameter einstellen:

-Das Startalter gibt an, wie alt der Baum beim Start des Wachstums sein soll.

-Der Startzeitpunkt gibt an, zu welchem Zeitpunkt in der Simulation der Baum zu wachsen beginnen soll.

-Die Standortklasse gibt an, wie gut die Umgebung, in der der Baum wächst, für dessen Wachstum ist.

-Die Überschirmung gibt an, wie stark der Baum von anderen Bäumen im Wald überschirmt wird. Dadurch bekommt der Baum weniger Sonne ab und das Wachstum ist somit eingeschränkt.

-Die Simulationslaufzeit ist ein globaler Parameter und bestimmt die Dauer der gesamten Simulation in Jahren

-Die Simulationsgeschwindigkeit ist der zweite globale Parameter und bestimmt wie schnell die Simulation in der Applikation angezeigt wird. Sie beeinflusst die Simulationsergebnisse nicht.

Nach dem Einstellen der Simulationsparameter kann die Simulation durch einen Klick auf Start gestartet werden. Durch Drücken von Stop bzw. Start kann die Simulation pausiert bzw. wieder gestartet werden. Das Drücken von Reset setzt die Simulation zurück und somit kann eine neue Simulation mit abgeänderten Parametern gestartet werden. Vorsicht: Solange die Simulation nur pausiert ist, hat das Ändern der Simulationsparameter keinen Einfluss auf die Simulation (ein Reset ist nötig). Anzumerken ist auch, dass sich Baumarten in den Graphen durch anklicken in der Legende ausblenden lassen.