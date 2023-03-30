function lydiaXState() {
 return ```import { createMachine, assign } from 'xstate';

const lydiaXState = createMachine<>({
  
	id:"L4Lydia",
	initial:"Login",
	states:{
		Login:{
			description:"Nennen Sie Ihre Benutzerkennung.",
			on:{
				Loginerfolgreich:"stationswahl",
				Benutzernichtvorhanden:"Ende",
			}
		},
		TrolleyModusBehaelterstart:{
			description:"Scannen Sie eine EIDIE die mit dem Behälter verknüpft werden soll. Verfügbare Befehle: Behälter scannen, abbruch",
			on:{
				Ja:"Positionsstart",
				Abbrechen:"TrolleyModus",
				Trolleymodusbeenden:"behaelterstart",
			},
			exit: ["test"]
		},
		Positionsansage:{
			description:"Gehen Sie zum (genannten) Lagerplatz (und starten die Kommissionierung)   verfügbare Befehle: Artikel Barcode Scannen, Artikel fehlt, Barcode fehlt, Scan abschließen, Position zurücksetzen, Behälter abbrechen, Behälter parken, Behälter zurücksetzen, Info Bezeichnung,  Info Preis, Info Verpackung, Info Behaelter, Info Artikel, Info Kunde, Info Station, Info Anzahl, Info Bestand, tntaus, tntan, Position überspringen, weiter, zurück",
			on:{
				Abbrechen:"BehaelterAbbruch",
				Postionsabbruch:"PositionsAbbruch",
				Parken:"Parken",
				Artikelfehlt:"Artikelfehlt",
				Reset:"BehaelterZuruecksetzen",
				Preisnrweichtab:"Preisnrfalsch",
				Preisnrkorrekt:"Mengenansage",
				PositionUeberspringen:"SkipPosition",
				Anbrucherfassen:"Anbruch",
			}
		},
		Behaelterende:{
			on:{
				Weiter:"behaelterstart",
				AutoOriginalkartonAbfrage:"OriginalkartonAbfrage",
				AutoTrolleymodus:"TrolleyModusBehaelterstart",
			}
		},
		Packmodus:{
			description:"Sie befinden sich im Packmodus.  Verfügbare Befehle: Info Station, Packmodus beenden, Info Artikel, Info Bezeichnung, Info Preis, Info Verpackung, Info Bestand",
			on:{
				Packmodusbeenden:"behaelterstart",
			}
		},
		StationsErgaenzung:{
			description:"Nennen Sie eine Stationsnummer, die Sie hinzufügen möchten.  Verfügbare Befehle: Stationsnummer nennen, zurück, Info Station",
			on:{
				StationHinzugefuegt:"behaelterstart",
			}
		},
		Ende:{
		type:"final"
		},
		Positionsstart:{
			description:"Scannen Sie den entsprechenden Artikelcode.",
			on:{
				Positiongeladen:"Positionsansage",
				BehaelterAbgeschlossen:"Behaelterende",
			}
		},
		Mengenansage:{
			description:"Erfassen Sie die Menge  verfügbare Befehle: Artikel Barcode Scannen, Menge erfassen, Artikel fehlt, Behälter abbrechen, Scan abschließen, Info Bezeichnung,  Info Preis, Info Verpackung, Info Behaelter, Info Artikel, Info Kunde, Info Station, Info Anzahl, Info Bestand, tntaus, tntan, weiter, zurück",
			on:{
				Abbrechen:"BehaelterAbbruch",
				ZurueckPositionsansage:"Positionsansage",
				Postionsabbruch:"PositionsAbbruch",
				Mengekorrekt:"Positionsende",
				Mengeweichtab:"Mengefalsch",
				Artikelfehlt:"Artikelfehlt",
			}
		},
		Parken:{
			description:"Bestätigen Sie, dass Sie den Behälter parken möchten.  Verfügbare Befehle: weiter, zurück",
			on:{
				Ja:"behaelterstart",
				NichtParken:"Positionsansage",
			}
		},
		Mengefalsch:{
			description:"Bestätigen Sie, dass Sie die Menge ändern möchten. Verfügbare Befehle: weiter, zurück, Artikel fehlt, Behälter abbrechen, Info Bezeichnung,  Info Preis, Info Verpackung, Info Behaelter, Info Artikel, Info Kunde, Info Station, Info Anzahl, Info Bestand",
			on:{
				Abbrechen:"BehaelterAbbruch",
				KeineMengenaenderung:"Mengenansage",
				Ja:"Positionsende",
				Artikelfehlt:"Artikelfehlt",
			}
		},
		BehaelterAbbruch:{
			description:"Bestätigen Sie, dass Sie den Behälter abbrechen möchten. Verfügbare Befehle: weiter, zurück",
			on:{
				ZurueckMengefalsch:"Mengefalsch",
				Ja:"behaelterstart",
				KeinAbbruch:"Preisnrfalsch",
				NichtAbbrechen:"Positionsansage",
				AutoTrolleymodus:"TrolleyModusBehaelterstart",
				Parken:"Parken",
				ZurueckMengenansage:"Mengenansage",
				Zurueck:"Anbruch",
			}
		},
		StationsEntfernung:{
			description:"Nennen Sie eine Stationsnummer, die Sie entfernen möchten.  Verfügbare Befehle: Stationsnummer nennen, zurück, Info Station",
			on:{
				StationEntfernt:"behaelterstart",
			}
		},
		OriginalkartonStart:{
			description:"Scannen Sie eine EIDIE die mit dem Originalkarton verknüpft werden soll. Verfügbare Befehle: Behälter scannen, abbruch",
			on:{
				Zurueck:"OriginalkartonAbfrage",
				Positionenvorhanden:"Positionsstart",
				Weiter:"behaelterstart",
			}
		},
		Preisnrfalsch:{
			description:"Bestätigen Sie, dass Sie die Position packen möchten.  Verfügbare Befehle: weiter, zurück, Artikel fehlt, Behälter abbrechen, Info Bezeichnung,  Info Preis, Info Verpackung, Info Behaelter, Info Artikel, Info Kunde, Info Station, Info Anzahl, Info Bestand",
			on:{
				Abbrechen:"BehaelterAbbruch",
				KeinPreiswechsel:"Positionsansage",
				Ja:"Mengenansage",
				Artikelfehlt:"Artikelfehlt",
			}
		},
		Anbruch:{
			description:"Bestätigen Sie, dass Sie die Position packen möchten.  Verfügbare Befehle: weiter, zurück, Artikel fehlt, Behälter abbrechen, Info Bezeichnung,  Info Preis, Info Verpackung, Info Behaelter, Info Artikel, Info Kunde, Info Station, Info Anzahl, Info Bestand",
			on:{
				Zurueck:"Positionsansage",
				Weiter:"Mengenansage",
				Abbruch:"BehaelterAbbruch",
				Artikelfehlt:"Artikelfehlt"			}
		},
		stationswahl:{
			description:"Nennen Sie ihre Stationsnummer.  Verfügbare Befehle: Stationsnummer nennen, Kommissionierung beenden",
			on:{
				AutoTrolleymodus:"TrolleyModus",
				Stationswahlerfolgreich:"behaelterstart",
				Programmende:"Endabfrage",
			}
		},
		PositionsAbbruch:{
			description:"Bestätigen Sie,&nbsp;  dass Sie die aktuelle Position abbrechen möchten.   Verfügbare Befehle: zurück, aktuelle, letzte",
			on:{
				Positionabgebrochen:"Positionsstart",
				Abbruchdurchgefuehrt:"Positionsansage",
			}
		},
		Endabfrage:{
			description:"Bestätigen Sie, dass Sie die Kommissionierung beenden möchten.  Verfügbare Befehle: weiter, zurück",
			on:{
				ZurueckBehaelterstart:"behaelterstart",
				ZurueckStation:"stationswahl",
				Ja:"Ende",
			}
		},
		SkipPosition:{
			description:"Bestätigen Sie, dass Sie die aktuelle Position überspringen möchten.  Verfügbare Befehle: weiter, zurück",
			on:{
				ZurueckPositionsansage:"Positionsansage",
				Ja:"Positionsende",
			}
		},
		Positionsende:{
			description:"Bestätigen Sie, dass Sie die aktuelle Position abschließen möchten. Verfügbare Befehle: weiter, zurück",
			on:{
				NchstePosition:"Positionsstart",
			}
		},
		TrolleyModus:{
			description:"Bestätigen Sie, dass Sie den Trollimodus starten möchten. Verfügbare Befehle: weiter, zurück",
			on:{
				TrolleymodusBehaelterstarten:"TrolleyModusBehaelterstart",
				Trolleymodusbeenden:"behaelterstart",
			}
		},
		behaelterstart:{
			description:"Scannen Sie einen Behältercode. verfügbare Befehle: Behältercode Scannen, Station wechseln, Station hinzufügen, Station entfernen, Info Station, Packmodus starten, Originalkarton starten, Kommissionierung beenden",
			on:{
				AutoAbfrage:"OriginalkartonAbfrage",
				StationEntfernen:"StationsEntfernung",
				Packmodusstarten:"Packmodus",
				Trolleymodusstarten:"TrolleyModus",
				Programmende:"Endabfrage",
				Positionenvorhanden:"Positionsstart",
				Stationswechsel:"stationswahl",
			}
		},
		BehaelterZuruecksetzen:{
			description:"Bestätigen Sie, dass Sie den Behälter zurücksetzen möchten.  Verfügbare Befehle: weiter, zurück",
			on:{
				Ja:"behaelterstart",
				NichtZuruecksetzen:"Positionsansage",
			}
		},
		Artikelfehlt:{
			description:"Bestätigen Sie, dass Sie die aktuelle Position nullen möchten.  Verfügbare Befehle: weiter, zurück",
			on:{
				Ja:"Positionsende",
				ArtikelNichtGenullt:"Mengenansage",
				ArtikelGenullt:"Mengefalsch",
				Zurueck:"Anbruch",
				ArtikelFehltNicht:"Preisnrfalsch",
				ArtikelfehltNicht:"Positionsansage",
			}
		},
		OriginalkartonAbfrage:{
			description:"Bestätigen Sie, dass Sie einen Originalkarton starten möchten. Verfügbare Befehle: weiter, zurück",
			on:{
				Weiter:"OriginalkartonStart",
				Weiter:"behaelterstart",
			}
		}
	}
});```
}

module.exports = { lydiaXState };