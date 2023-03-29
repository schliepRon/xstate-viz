import { SupabaseAuthClient } from '@supabase/supabase-js/dist/main/lib/SupabaseAuthClient';
import { useActor, useSelector } from '@xstate/react';
import { NextRouter } from 'next/router';
import {
  ActorRefFrom,
  assign,
  ContextFrom,
  DoneInvokeEvent,
  EventFrom,
  forwardTo,
  send,
  sendParent,
  spawn,
  State,
  StateFrom,
} from 'xstate';
import { choose } from 'xstate/lib/actions';
import { createModel } from 'xstate/lib/model';
import { SourceFile } from './apiTypes';
import { useAuth } from './authContext';
import { AuthMachine } from './authMachine';
import { cacheCodeChangesMachine } from './cacheCodeChangesMachine';
import { confirmBeforeLeavingMachine } from './confirmLeavingService';
import { isOnClientSide } from './isOnClientSide';
import { localCache } from './localCache';
import { notifMachine, notifModel } from './notificationMachine';
import { SourceProvider, SourceRegistryData } from './types';
import {
  callAPI,
  isErrorWithMessage,
  isSignedIn,
  updateQueryParamsWithoutReload,
} from './utils';

const initialMachineCode = `
import { createMachine } from 'xstate';
`.trim();

const exampleMachineCode = `
import { createMachine, assign } from 'xstate';

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
});
`.trim();

export const sourceModel = createModel(
  {
    sourceID: null as string | null,
    sourceProvider: null as SourceProvider | null,
    sourceRawContent: null as string | null,
    sourceRegistryData: null as SourceRegistryData | null,
    notifRef: null! as ActorRefFrom<typeof notifMachine>,
    loggedInUserId: null as string | null,
    desiredMachineName: null as string | null,
  },
  {
    events: {
      EXAMPLE_REQUESTED: () => ({}),
      SAVE: () => ({}),
      FORK: () => ({}),
      CREATE_NEW: () => ({}),
      LOADED_FROM_GIST: (rawSource: string) => ({
        rawSource,
      }),
      LOADED_FROM_REGISTRY: (data: NonNullable<SourceFile>) => ({ data }),
      CODE_UPDATED: (code: string, sourceID: string | null) => ({
        code,
        sourceID,
      }),
      /**
       * Passed in from the parent to the child via events
       */
      LOGGED_IN_USER_ID_UPDATED: (id: string | null | undefined) => ({ id }),
      CHOOSE_NAME: (name: string) => ({ name }),
      CLOSE_NAME_CHOOSER_MODAL: () => ({}),
      MACHINE_ID_CHANGED: (id: string) => ({ id }),
    },
  },
);

export type SourceMachineActorRef = ActorRefFrom<
  ReturnType<typeof makeSourceMachine>
>;

export type SourceMachineState = State<
  ContextFrom<typeof sourceModel>,
  EventFrom<typeof sourceModel>
>;

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }

  toString() {
    return this.message;
  }
}

// TODO - find a better way to handle this than dynamically changing the invoked services
function getInvocations(isEmbedded: boolean) {
  if (!isEmbedded) {
    return [
      {
        src: cacheCodeChangesMachine,
        id: 'codeCacheMachine',
      },
      {
        src: confirmBeforeLeavingMachine,
        id: 'confirmBeforeLeavingMachine',
      },
    ];
  } else [];
}

export const makeSourceMachine = (params: {
  auth: SupabaseAuthClient;
  sourceRegistryData: SourceRegistryData | null;
  router: NextRouter;
  isEmbedded: boolean;
}) => {
  return sourceModel.createMachine(
    {
      initial: 'checking_initial_data',
      preserveActionOrder: true,
      context: {
        ...sourceModel.initialContext,
        sourceRawContent: params.sourceRegistryData?.text || null,
        sourceID: params.sourceRegistryData?.id || null,
        sourceProvider: params.sourceRegistryData ? 'registry' : null,
        sourceRegistryData: params.sourceRegistryData,
      },
      entry: assign({ notifRef: () => spawn(notifMachine) }),
      on: {
        LOGGED_IN_USER_ID_UPDATED: {
          actions: assign((context, event) => {
            return {
              loggedInUserId: event.id,
            };
          }),
        },
        /**
         * When the machine id changes from the sim machine,
         * set the desiredMachineName to it
         */
        MACHINE_ID_CHANGED: {
          actions: assign((context, event) => {
            return {
              desiredMachineName: event.id,
            };
          }),
        },
      },
      states: {
        checking_initial_data: {
          always: [
            {
              target: 'with_source',
              cond: (ctx) => Boolean(ctx.sourceRegistryData),
            },
            {
              target: 'checking_if_on_legacy_url',
            },
          ],
        },
        checking_if_on_legacy_url: {
          onDone: 'checking_url',
          meta: {
            description: `This state checks if you're on /id?=<id>, and redirects to you /<id>`,
          },
          initial: 'checking_if_id_on_query_params',
          states: {
            checking_if_id_on_query_params: {
              always: [
                {
                  cond: (ctx) => {
                    // TODO: check if `params.router.query.id` can be reliably used here instead of the client check
                    if (!isOnClientSide()) return false;
                    const queries = new URLSearchParams(window.location.search);

                    return Boolean(
                      queries.get('id') && !ctx.sourceRegistryData,
                    );
                  },
                  target: 'redirecting',
                },
                {
                  target: 'check_complete',
                },
              ],
            },
            redirecting: {
              entry: 'redirectToNewUrlFromLegacyUrl',
            },
            check_complete: {
              type: 'final',
            },
          },
        },
        checking_url: {
          entry: 'parseQueries',
          always: [
            { target: 'with_source', cond: (ctx) => Boolean(ctx.sourceID) },
            { target: 'no_source' },
          ],
        },
        with_source: {
          id: 'with_source',
          initial: 'loading_content',
          on: {
            CREATE_NEW: {
              actions: 'openNewWindowAtRoot',
            },
            FORK: [
              {
                target: '#creating',
                cond: () => isSignedIn(),
                actions: ['addForkOfToDesiredName'],
              },
              {
                actions: sendParent(
                  'LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION',
                ),
              },
            ],
          },
          states: {
            loading_content: {
              on: {
                LOADED_FROM_REGISTRY: [
                  {
                    target: 'source_loaded',
                    actions: assign((context, event) => {
                      return {
                        sourceID: event.data.id,
                        sourceRawContent: event.data.text,
                        sourceRegistryData: {
                          ...event.data,
                          dataSource: 'client',
                        },
                      };
                    }),
                  },
                ],
                LOADED_FROM_GIST: {
                  target: 'source_loaded.user_does_not_own_this_source',
                  actions: assign((context, event) => {
                    return {
                      sourceRawContent: event.rawSource,
                    };
                  }),
                },
              },
              invoke: {
                src: 'loadSourceContent',
                onError: 'source_error',
              },
            },
            source_loaded: {
              entry: ['getLocalStorageCachedSource'],
              on: {
                CODE_UPDATED: {
                  actions: [
                    assign({
                      sourceRawContent: (ctx, e) => e.code,
                    }),
                    choose<
                      ContextFrom<typeof sourceModel>,
                      Extract<
                        EventFrom<typeof sourceModel>,
                        { type: 'CODE_UPDATED' }
                      >
                    >([
                      {
                        actions: [
                          forwardTo('codeCacheMachine'),
                          forwardTo('confirmBeforeLeavingMachine'),
                        ],
                        cond: () => !params.isEmbedded,
                      },
                    ]),
                  ],
                },
                LOGGED_IN_USER_ID_UPDATED: {
                  actions: assign((context, event) => {
                    return {
                      loggedInUserId: event.id,
                    };
                  }),
                  target: '.checking_if_user_owns_source',
                },
              },
              invoke: getInvocations(params.isEmbedded),
              initial: 'checking_if_user_owns_source',
              states: {
                checking_if_user_owns_source: {
                  always: [
                    {
                      cond: (ctx) => {
                        const ownerId =
                          ctx.sourceRegistryData?.project?.owner?.id;

                        if (!ownerId || !ctx.loggedInUserId) return false;

                        return ownerId === ctx.loggedInUserId;
                      },
                      target: 'user_owns_this_source',
                    },
                    {
                      target: 'user_does_not_own_this_source',
                    },
                  ],
                },
                user_owns_this_source: {
                  on: {
                    SAVE: [
                      {
                        cond: () => isSignedIn(),
                        target: '#updating',
                      },
                      {
                        actions: sendParent(
                          'LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION',
                        ),
                      },
                    ],
                  },
                },
                user_does_not_own_this_source: {
                  on: {
                    SAVE: [
                      {
                        cond: () => isSignedIn(),
                        target: '#creating',
                        actions: ['addForkOfToDesiredName'],
                      },
                      {
                        actions: sendParent(
                          'LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION',
                        ),
                      },
                    ],
                  },
                },
              },
            },
            source_error: {
              entry: [
                send(
                  (_, e: any) => {
                    if (e.data !== null && isErrorWithMessage(e.data)) {
                      return notifModel.events.BROADCAST(
                        e.data.message,
                        'error',
                      );
                    }
                    return notifModel.events.BROADCAST(
                      'No source file found',
                      'info',
                    );
                  },
                  { to: (ctx: any) => ctx.notifRef },
                ),
                (_: any, e: any) => {
                  if (e.data instanceof NotFoundError) {
                    updateQueryParamsWithoutReload((queries) => {
                      queries.delete('id');
                      queries.delete('gist');
                    });
                  }
                },
              ],
            },
          },
        },
        no_source: {
          id: 'no_source',
          on: {
            CODE_UPDATED: {
              actions: [
                assign({
                  sourceRawContent: (ctx, e) => e.code,
                }),
                choose<
                  ContextFrom<typeof sourceModel>,
                  Extract<
                    EventFrom<typeof sourceModel>,
                    { type: 'CODE_UPDATED' }
                  >
                >([
                  {
                    actions: [
                      forwardTo('codeCacheMachine'),
                      forwardTo('confirmBeforeLeavingMachine'),
                    ],
                    cond: () => !params.isEmbedded,
                  },
                ]),
              ],
            },
            SAVE: [
              {
                cond: () => isSignedIn(),
                target: 'creating',
              },
              {
                actions: sendParent(
                  'LOGGED_OUT_USER_ATTEMPTED_RESTRICTED_ACTION',
                ),
              },
            ],
          },
          invoke: getInvocations(params.isEmbedded),
          initial: 'checking_if_in_local_storage',
          states: {
            checking_if_in_local_storage: {
              always: [
                {
                  cond: 'hasLocalStorageCachedSource',
                  target: 'has_cached_source',
                },
                {
                  target: 'no_cached_source',
                },
              ],
            },
            has_cached_source: {
              entry: ['getLocalStorageCachedSource'],
            },
            no_cached_source: {
              tags: ['canShowWelcomeMessage', 'noCachedSource'],
              on: {
                EXAMPLE_REQUESTED: {
                  actions: 'assignExampleMachineToContext',
                },
              },
            },
          },
        },
        creating: {
          id: 'creating',
          initial: 'showingNameModal',
          states: {
            showingNameModal: {
              on: {
                CHOOSE_NAME: {
                  target: 'pendingSave',
                  actions: assign((_, event) => {
                    return {
                      desiredMachineName: event.name,
                    };
                  }),
                },
                CLOSE_NAME_CHOOSER_MODAL: [
                  {
                    target: '#with_source.source_loaded',
                    cond: (ctx) => Boolean(ctx.sourceID),
                  },
                  { target: '#no_source' },
                ],
              },
            },

            pendingSave: {
              tags: ['persisting'],
              invoke: {
                src: 'createSourceFile',
                onDone: {
                  target: '#with_source.source_loaded.user_owns_this_source',
                  actions: [
                    'clearLocalStorageEntryForCurrentSource',
                    'assignCreateSourceFileToContext',
                    'updateURLWithMachineID',
                    send(
                      notifModel.events.BROADCAST(
                        'New file saved successfully!',
                        'success',
                      ),
                      {
                        to: (ctx) => {
                          return ctx.notifRef!;
                        },
                      },
                    ),
                  ],
                },
                onError: [
                  {
                    /**
                     * If the source had an ID, it means we've forking
                     * someone else's
                     */
                    cond: (ctx) => Boolean(ctx.sourceID),
                    target:
                      '#with_source.source_loaded.checking_if_user_owns_source',
                    actions: 'showSaveErrorToast',
                  },
                  {
                    target: '#no_source',
                    actions: 'showSaveErrorToast',
                  },
                ],
              },
            },
          },
        },
        updating: {
          tags: ['persisting'],
          id: 'updating',
          invoke: {
            src: 'updateSourceFile',
            onDone: {
              target: 'with_source.source_loaded.user_owns_this_source',
              actions: [
                assign((_, event: DoneInvokeEvent<SourceFile>) => {
                  return {
                    sourceID: event.data.id,
                    sourceProvider: 'registry',
                    sourceRegistryData: {
                      ...event.data,
                      dataSource: 'client',
                    },
                  };
                }),
                send(
                  notifModel.events.BROADCAST('Saved successfully', 'success'),
                  {
                    to: (ctx) => {
                      return ctx.notifRef!;
                    },
                  },
                ),
              ],
            },
            onError: {
              target: 'with_source.source_loaded',
              actions: send(
                notifModel.events.BROADCAST(
                  'An error occurred when saving.',
                  'error',
                ),
                {
                  to: (ctx) => {
                    return ctx.notifRef!;
                  },
                },
              ),
            },
          },
        },
      },
    },
    {
      guards: {
        hasLocalStorageCachedSource: (context) => {
          const result = localCache.getSourceRawContent(
            context.sourceID,
            context.sourceRegistryData?.updatedAt.toString() ?? null,
          );

          return Boolean(result);
        },
      },
      actions: {
        redirectToNewUrlFromLegacyUrl: () => {
          const id = new URLSearchParams(window.location.search).get('id');
          params.router.replace(`/${id}`, undefined, { shallow: true });
        },
        assignExampleMachineToContext: assign((context, event) => {
          return {
            sourceRawContent: exampleMachineCode,
          };
        }),
        clearLocalStorageEntryForCurrentSource: (ctx) => {
          localCache.removeSourceRawContent(ctx.sourceID);
        },
        addForkOfToDesiredName: assign((context, event) => {
          if (
            !context.desiredMachineName ||
            context.desiredMachineName?.endsWith('(forked)')
          ) {
            return {};
          }
          return {
            desiredMachineName: `${context.desiredMachineName} (forked)`,
          };
        }),
        showSaveErrorToast: send(
          notifModel.events.BROADCAST(
            'An error occurred when saving.',
            'error',
          ),
          {
            to: (ctx) => {
              return ctx.notifRef!;
            },
          },
        ),
        assignCreateSourceFileToContext: assign((_, _event: any) => {
          const event: DoneInvokeEvent<SourceFile> = _event;
          return {
            sourceID: event.data.id,
            sourceProvider: 'registry',
            sourceRegistryData: {
              ...event.data,
              dataSource: 'client',
            },
          };
        }),
        updateURLWithMachineID: (ctx) => {
          params.router.replace(`/${ctx.sourceID}`, undefined, {
            shallow: true,
          });
        },
        getLocalStorageCachedSource: assign((context, event) => {
          const result = localCache.getSourceRawContent(
            context.sourceID,
            context.sourceRegistryData?.updatedAt.toString() ?? null,
          );

          if (!result) {
            return {};
          }
          return {
            sourceRawContent: result,
          };
        }),
        parseQueries: assign((ctx) => {
          if (typeof window === 'undefined') return {};
          const queries = new URLSearchParams(window.location.search);
          if (queries.get('gist')) {
            return {
              sourceID: queries.get('gist'),
              sourceProvider: 'gist',
            };
          }
          if (queries.get('id')) {
            return {
              sourceID: queries.get('id'),
              sourceProvider: 'registry',
            };
          }
          return {};
        }),
        openNewWindowAtRoot: () => {
          window.open('/viz', '_blank', 'noopener');
        },
      },
      services: {
        createSourceFile: async (ctx): Promise<SourceFile> => {
          if (ctx.sourceID && ctx.sourceProvider === 'registry') {
            return callAPI<SourceFile>({
              endpoint: 'create-source-file',
              body: {
                text: ctx.sourceRawContent ?? '',
                name: ctx.desiredMachineName ?? '',
                forkFromId: ctx.sourceID,
              },
            }).then((res) => res.data);
          }
          return callAPI<SourceFile>({
            endpoint: 'create-source-file',
            body: {
              text: ctx.sourceRawContent ?? '',
              name: ctx.desiredMachineName ?? '',
            },
          }).then((res) => res.data);
        },
        updateSourceFile: async (ctx, e) => {
          if (e.type !== 'SAVE') return;
          return callAPI<SourceFile>({
            endpoint: 'update-source-file',
            body: {
              id: ctx.sourceID,
              text: ctx.sourceRawContent,
            },
          }).then((res) => res.data);
        },
        loadSourceContent: (ctx) => async (send) => {
          switch (ctx.sourceProvider) {
            case 'gist':
              const response = await fetch(
                'https://api.github.com/gists/' + ctx.sourceID,
              );
              // Fetch doesn't treat 404's as errors by default
              if (response.status === 404) {
                return Promise.reject(new NotFoundError('Gist not found'));
              }
              const json = await response.json();

              const gistResponse = await fetch(
                json.files['machine.js'].raw_url,
              );
              const rawSource = await gistResponse.text();

              send({
                type: 'LOADED_FROM_GIST',
                rawSource,
              });
              break;
            case 'registry':
              const result = await callAPI<SourceFile>({
                endpoint: 'get-source-file',
                queryParams: ctx.sourceID
                  ? new URLSearchParams({
                      sourceFileId: ctx.sourceID,
                    })
                  : undefined,
              });
              const sourceFile = result.data;
              if (!sourceFile) {
                throw new NotFoundError('Source not found in Registry');
              }

              send({
                type: 'LOADED_FROM_REGISTRY',
                data: sourceFile,
              });
              break;
            default:
              throw new Error('It should be impossible to reach this.');
          }
        },
      },
    },
  );
};

export const getSourceActor = (state: StateFrom<AuthMachine>) =>
  state.context.sourceRef!;

export const useSourceActor = () => {
  const authService = useAuth();
  const sourceService = useSelector(authService, getSourceActor);

  return useActor(sourceService!);
};

export const useSourceRegistryData = () => {
  const sourceService = useSelector(useAuth(), getSourceActor);
  return useSelector(
    sourceService,
    (state) => state.context.sourceRegistryData,
  );
};

export const getEditorValue = (state: SourceMachineState) => {
  return state.context.sourceRawContent || initialMachineCode;
};

export const getShouldImmediateUpdate = (state: SourceMachineState) => {
  return Boolean(state.context.sourceRawContent);
};
