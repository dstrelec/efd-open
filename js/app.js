const players = [
  { id: "dario-strelec", name: "Dario Strelec", shortName: "Dario", age: 47, role: "System Architect", tagline: "The Systems Maestro", nation: "Croatia", group: "A", seed: "A1", cardPath: "players/dario-strelec.html" },
  { id: "player-02", name: "Player 02", shortName: "P02", age: "TBD", role: "Digital Challenger", tagline: "Wildcard Loading", nation: "TBD", group: "A", seed: "A2", cardPath: "players/player-02.html" },
  { id: "player-03", name: "Player 03", shortName: "P03", age: "TBD", role: "Digital Challenger", tagline: "Serve Pending", nation: "TBD", group: "A", seed: "A3", cardPath: "players/player-03.html" },
  { id: "player-04", name: "Player 04", shortName: "P04", age: "TBD", role: "Digital Challenger", tagline: "Focus Mode", nation: "TBD", group: "A", seed: "A4", cardPath: "players/player-04.html" },
  { id: "player-05", name: "Player 05", shortName: "P05", age: "TBD", role: "Digital Challenger", tagline: "Ready To Rally", nation: "TBD", group: "A", seed: "A5", cardPath: "players/player-05.html" },
  { id: "player-06", name: "Player 06", shortName: "P06", age: "TBD", role: "Digital Challenger", tagline: "Match Point Incoming", nation: "TBD", group: "B", seed: "B1", cardPath: "players/player-06.html" },
  { id: "player-07", name: "Player 07", shortName: "P07", age: "TBD", role: "Digital Challenger", tagline: "Net Rush Pending", nation: "TBD", group: "B", seed: "B2", cardPath: "players/player-07.html" },
  { id: "player-08", name: "Player 08", shortName: "P08", age: "TBD", role: "Digital Challenger", tagline: "Baseline Control", nation: "TBD", group: "B", seed: "B3", cardPath: "players/player-08.html" },
  { id: "player-09", name: "Player 09", shortName: "P09", age: "TBD", role: "Digital Challenger", tagline: "Clutch Loader", nation: "TBD", group: "B", seed: "B4", cardPath: "players/player-09.html" },
  { id: "player-10", name: "Player 10", shortName: "P10", age: "TBD", role: "Digital Challenger", tagline: "Tournament Dark Horse", nation: "TBD", group: "B", seed: "B5", cardPath: "players/player-10.html" }
];

const PLAYOFF_MAP = [
  { seed: "A1", title: "Finale", subtitle: "Pobjednik Skupine A" },
  { seed: "B1", title: "Finale", subtitle: "Pobjednik Skupine B" },
  { seed: "A2", title: "3. mjesto", subtitle: "Drugi iz Skupine A" },
  { seed: "B2", title: "3. mjesto", subtitle: "Drugi iz Skupine B" },
  { seed: "A3", title: "5. mjesto", subtitle: "Treći iz Skupine A" },
  { seed: "B3", title: "5. mjesto", subtitle: "Treći iz Skupine B" },
  { seed: "A4", title: "7. mjesto", subtitle: "Četvrti iz Skupine A" },
  { seed: "B4", title: "7. mjesto", subtitle: "Četvrti iz Skupine B" },
  { seed: "A5", title: "9. mjesto", subtitle: "Peti iz Skupine A" },
  { seed: "B5", title: "9. mjesto", subtitle: "Peti iz Skupine B" }
];

const playoffMatches = [
  { id: "P-FINAL", stage: "Finale", label: "Borba za naslov", slotA: "A1", slotB: "B1" },
  { id: "P-BRONZE", stage: "3. mjesto", label: "Borba za broncu", slotA: "A2", slotB: "B2" },
  { id: "P-FIFTH", stage: "5. mjesto", label: "Borba za plasman", slotA: "A3", slotB: "B3" },
  { id: "P-SEVENTH", stage: "7. mjesto", label: "Borba za plasman", slotA: "A4", slotB: "B4" },
  { id: "P-NINTH", stage: "9. mjesto", label: "Borba za plasman", slotA: "A5", slotB: "B5" }
];

const SUPABASE_TABLE = "game_results";
const DEFAULT_TOURNAMENT_ID = "efd-open-2026";
const playerMap = Object.fromEntries(players.map((player) => [player.id, player]));
const groupMatches = buildGroupMatches();
let supabaseClient = null;
let syncStatus = {
  state: "loading",
  label: "Supabase",
  message: "Učitavanje rezultata iz baze"
};

function buildGroupMatches() {
  const matches = [];
  ["A", "B"].forEach((group) => {
    const groupPlayers = players.filter((player) => player.group === group);
    const rotation = [...groupPlayers.map((player) => player.id), null];
    const roundCount = rotation.length - 1;
    let counter = 1;

    for (let round = 0; round < roundCount; round += 1) {
      for (let i = 0; i < rotation.length / 2; i += 1) {
        const player1 = rotation[i];
        const player2 = rotation[rotation.length - 1 - i];
        if (player1 && player2) {
          matches.push({
            id: `${group}-M${counter}`,
            stage: `Skupina ${group}`,
            label: `Kolo ${round + 1}`,
            round: round + 1,
            player1,
            player2,
            group
          });
          counter += 1;
        }
      }

      rotation.splice(1, 0, rotation.pop());
    }
  });
  return matches;
}

function getPlayerName(playerId) {
  return playerMap[playerId]?.name || playerId;
}

function getSupabaseSettings() {
  return window.EFD_SUPABASE_CONFIG || {};
}

function getTournamentId() {
  return getSupabaseSettings().tournamentId || DEFAULT_TOURNAMENT_ID;
}

function isSupabaseConfigured(settings) {
  return Boolean(
    window.supabase &&
    settings.url &&
    settings.anonKey &&
    !settings.url.includes("YOUR_PROJECT_REF") &&
    !settings.anonKey.includes("YOUR_SUPABASE_ANON_KEY")
  );
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  const settings = getSupabaseSettings();
  if (!isSupabaseConfigured(settings)) {
    throw new Error("Supabase URL i anon key nisu konfigurirani u js/supabase-config.js.");
  }

  supabaseClient = window.supabase.createClient(settings.url, settings.anonKey);
  return supabaseClient;
}

function scoreToDatabase(value) {
  if (value === undefined || value === "") return null;
  const score = Number(value);
  return Number.isFinite(score) ? score : null;
}

function scoreFromDatabase(value) {
  return value === null || value === undefined ? "" : String(value);
}

async function loadResults() {
  syncStatus = { state: "loading", label: "Supabase", message: "Učitavanje rezultata iz baze" };

  try {
    const { data, error } = await getSupabaseClient()
      .from(SUPABASE_TABLE)
      .select("match_id, player1_score, player2_score")
      .eq("tournament_id", getTournamentId());

    if (error) throw error;

    syncStatus = { state: "ready", label: "Supabase sync", message: "Rezultati su učitani iz baze" };
    return (data || []).reduce((acc, row) => {
      acc[row.match_id] = {
        player1: scoreFromDatabase(row.player1_score),
        player2: scoreFromDatabase(row.player2_score)
      };
      return acc;
    }, {});
  } catch (error) {
    syncStatus = {
      state: "error",
      label: "Supabase nije spreman",
      message: error.message || "Provjeri Supabase konfiguraciju i tablicu game_results"
    };
    return {};
  }
}

async function saveMatchResult(matchId, result) {
  const payload = {
    tournament_id: getTournamentId(),
    match_id: matchId,
    player1_score: scoreToDatabase(result.player1),
    player2_score: scoreToDatabase(result.player2)
  };

  try {
    const { error } = await getSupabaseClient()
      .from(SUPABASE_TABLE)
      .upsert(payload, { onConflict: "tournament_id,match_id" });

    if (error) throw error;
    syncStatus = { state: "ready", label: "Supabase sync", message: "Zadnja promjena je spremljena u bazu" };
  } catch (error) {
    syncStatus = {
      state: "error",
      label: "Supabase greška",
      message: error.message || "Promjena nije spremljena"
    };
  }
}

function getPlayerBySeed(seed, standingsByGroup) {
  const group = seed.charAt(0);
  const position = Number(seed.slice(1)) - 1;
  return standingsByGroup[group]?.[position] || null;
}

function calculateStandings(results) {
  const standings = {
    A: players.filter((player) => player.group === "A").map(initStanding),
    B: players.filter((player) => player.group === "B").map(initStanding)
  };

  groupMatches.forEach((match) => {
    const result = results[match.id];
    if (!result) return;

    const p1 = standings[match.group].find((entry) => entry.id === match.player1);
    const p2 = standings[match.group].find((entry) => entry.id === match.player2);
    const score1 = Number(result.player1);
    const score2 = Number(result.player2);

    if (!Number.isFinite(score1) || !Number.isFinite(score2) || score1 === score2) return;

    p1.matches += 1;
    p2.matches += 1;
    p1.gamesWon += score1;
    p1.gamesLost += score2;
    p2.gamesWon += score2;
    p2.gamesLost += score1;

    if (score1 > score2) {
      p1.wins += 1;
      p2.losses += 1;
      p1.headToHead.add(p2.id);
    } else {
      p2.wins += 1;
      p1.losses += 1;
      p2.headToHead.add(p1.id);
    }
  });

  return { A: sortStandings(standings.A), B: sortStandings(standings.B) };
}

function initStanding(player) {
  return { id: player.id, name: player.name, wins: 0, losses: 0, matches: 0, gamesWon: 0, gamesLost: 0, headToHead: new Set() };
}

function sortStandings(entries) {
  return [...entries].sort((a, b) => {
    const byWins = b.wins - a.wins;
    if (byWins !== 0) return byWins;
    const h2h = Number(b.headToHead.has(a.id)) - Number(a.headToHead.has(b.id));
    if (h2h !== 0) return h2h;
    const diff = (b.gamesWon - b.gamesLost) - (a.gamesWon - a.gamesLost);
    if (diff !== 0) return diff;
    const byGamesWon = b.gamesWon - a.gamesWon;
    if (byGamesWon !== 0) return byGamesWon;
    return a.name.localeCompare(b.name);
  });
}

function renderMatchList(container, results) {
  const grouped = groupMatches.reduce((acc, match) => {
    if (!acc[match.group]) acc[match.group] = {};
    if (!acc[match.group][match.round]) acc[match.group][match.round] = [];
    acc[match.group][match.round].push(match);
    return acc;
  }, {});

  container.innerHTML = ["A", "B"].map((group) => `
    <section class="match-group-block">
      <div class="match-group-head">
        <div>
          <div class="badge">Skupina ${group}</div>
          <h3 class="stage-title">Raspored i rezultati</h3>
        </div>
        <p>Dva meča po kolu, jedan igrač je slobodan.</p>
      </div>
      <div class="match-rounds">
        ${Object.keys(grouped[group] || {}).map((round) => `
          <section class="match-round">
            <div class="match-round-title">Kolo ${round}</div>
            <div class="match-round-grid">
              ${(grouped[group][round] || []).map((match) => {
                const saved = results[match.id] || {};
                return `
                  <article class="match-card">
                    <div class="match-head">
                      <span class="mini-label">${match.id}</span>
                    </div>
                    <div class="score-entry">
                      <div class="player-pill">
                        <span class="input-label">Igrač 1</span>
                        <strong>${getPlayerName(match.player1)}</strong>
                      </div>
                      <label>
                        <span class="input-label">Gemovi</span>
                        <select data-match-id="${match.id}" data-player-key="player1">${buildScoreOptions(saved.player1)}</select>
                      </label>
                      <label>
                        <span class="input-label">Gemovi</span>
                        <select data-match-id="${match.id}" data-player-key="player2">${buildScoreOptions(saved.player2)}</select>
                      </label>
                    </div>
                    <div class="score-summary" style="margin-top: 12px;">
                      <div class="player-pill">
                        <span class="input-label">Igrač 2</span>
                        <strong>${getPlayerName(match.player2)}</strong>
                      </div>
                      <div class="player-pill">
                        <span class="input-label">Status</span>
                        <strong>${describeResult(saved.player1, saved.player2)}</strong>
                      </div>
                    </div>
                  </article>
                `;
              }).join("")}
            </div>
          </section>
        `).join("")}
      </div>
    </section>
  `).join("");
}

function buildScoreOptions(selectedValue) {
  const numericValue = selectedValue === undefined || selectedValue === "" ? "" : String(selectedValue);
  return [`<option value="">-</option>`]
    .concat(Array.from({ length: 8 }, (_, index) => `<option value="${index}" ${numericValue === String(index) ? "selected" : ""}>${index}</option>`))
    .join("");
}

function describeResult(player1, player2) {
  if (player1 === undefined || player2 === undefined || player1 === "" || player2 === "") return "Rezultat čeka unos";
  if (Number(player1) === Number(player2)) return "Rezultat mora imati pobjednika";
  return `${player1}:${player2}`;
}

function renderStandings(container, standingsByGroup) {
  container.innerHTML = ["A", "B"].map((group) => `
    <section class="standings-card">
      <div class="badge">Skupina ${group}</div>
      <h3 class="stage-title">Tablica skupine ${group}</h3>
      <table class="standings-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Igrač</th>
            <th>W</th>
            <th>L</th>
            <th>GW</th>
            <th>GL</th>
          </tr>
        </thead>
        <tbody>
          ${standingsByGroup[group].map((entry, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${entry.name}</td>
              <td>${entry.wins}</td>
              <td>${entry.losses}</td>
              <td>${entry.gamesWon}</td>
              <td>${entry.gamesLost}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
      <p class="standings-note">Tie-break logika: pobjede, head-to-head, game razlika, osvojeni gemovi.</p>
    </section>
  `).join("");
}

function renderQualifiers(container, standingsByGroup) {
  container.innerHTML = PLAYOFF_MAP.map((item) => {
    const player = getPlayerBySeed(item.seed, standingsByGroup);
    return `
      <article class="qualifier-card">
        <span class="qualifier-label">${item.title}</span>
        <strong class="qualifier-name">${player ? player.name : "Čeka rasplet"}</strong>
        <p class="group-note">${item.subtitle}</p>
      </article>
    `;
  }).join("");
}

function renderPlayoffBracket(container, standingsByGroup, results) {
  container.innerHTML = playoffMatches.map((match) => {
    const playerA = getPlayerBySeed(match.slotA, standingsByGroup);
    const playerB = getPlayerBySeed(match.slotB, standingsByGroup);
    const saved = results[match.id] || {};
    return `
      <article class="placement-card">
        <span class="draw-label">${match.stage}</span>
        <div class="draw-matchup">${playerA ? playerA.name : match.slotA} vs ${playerB ? playerB.name : match.slotB}</div>
        <p class="group-note">${match.label}</p>
        <div class="score-entry placement-score" style="margin-top: 16px;">
          <label>
            <span class="input-label">${playerA ? playerA.name : match.slotA}</span>
            <select data-match-id="${match.id}" data-player-key="player1">${buildScoreOptions(saved.player1)}</select>
          </label>
          <label>
            <span class="input-label">${playerB ? playerB.name : match.slotB}</span>
            <select data-match-id="${match.id}" data-player-key="player2">${buildScoreOptions(saved.player2)}</select>
          </label>
          <div class="player-pill">
            <span class="input-label">Rezultat</span>
            <strong>${describeResult(saved.player1, saved.player2)}</strong>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function bindForm(root, results, rerender) {
  root.querySelectorAll("select[data-match-id]").forEach((select) => {
    select.addEventListener("change", async (event) => {
      const { matchId, playerKey } = event.target.dataset;
      results[matchId] = results[matchId] || {};
      results[matchId][playerKey] = event.target.value;
      await saveMatchResult(matchId, results[matchId]);
      rerender();
    });
  });
}

async function initTournamentPage() {
  const matchList = document.querySelector("[data-match-list]");
  if (!matchList) return;

  const standingsContainer = document.querySelector("[data-standings]");
  const qualifiersContainer = document.querySelector("[data-qualifiers]");
  const bracketContainer = document.querySelector("[data-playoff-bracket]");
  const infoBanner = document.querySelector("[data-tournament-status]");
  const results = await loadResults();

  const rerender = () => {
    renderMatchList(matchList, results);
    const standingsByGroup = calculateStandings(results);
    renderStandings(standingsContainer, standingsByGroup);
    renderQualifiers(qualifiersContainer, standingsByGroup);
    renderPlayoffBracket(bracketContainer, standingsByGroup, results);
    updateStatus(infoBanner, results, standingsByGroup);
    bindForm(document, results, rerender);
  };

  rerender();
}

function updateStatus(container, results, standingsByGroup) {
  if (!container) return;

  const completedGroups = groupMatches.filter((match) => {
    const result = results[match.id];
    return result && result.player1 !== "" && result.player2 !== "" && result.player1 !== undefined && result.player2 !== undefined && Number(result.player1) !== Number(result.player2);
  }).length;

  const finalists = [getPlayerBySeed("A1", standingsByGroup), getPlayerBySeed("B1", standingsByGroup)]
    .map((entry) => entry?.name || "TBD")
    .join(" vs ");

  container.innerHTML = `
    <div class="stage-chip"><strong>${completedGroups}/20</strong><br>grupnih mečeva upisano</div>
    <div class="stage-chip"><strong>${finalists}</strong><br>trenutni projected finale</div>
    <div class="stage-chip"><strong>${syncStatus.label}</strong><br>${syncStatus.message}</div>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  initTournamentPage();
});
