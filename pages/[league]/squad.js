import Menu from "../../components/Menu";
import redirect from "../../Modules/league";
import Head from "next/head";
import { SquadPlayer as Player } from "../../components/Player";
import { useState, useEffect } from "react";
import { push } from "@socialgouv/matomo-next";
import connect from "../../Modules/database.mjs";
import { InputLabel, MenuItem, Select } from "@mui/material";

export default function Home({
  session,
  league,
  starredPercentage,
  notify,
  leagueName,
}) {
  const [squad, setSquad] = useState({
    att: [],
    mid: [],
    def: [],
    gk: [],
    bench: [],
  });
  const [formation, setFormation] = useState([1, 4, 4, 2]);
  const [validFormations, setValidFormations] = useState([[1, 4, 4, 2]]);
  const field = {
    att: squad.att.length < formation[3],
    mid: squad.mid.length < formation[2],
    def: squad.def.length < formation[1],
    gk: squad.gk.length < formation[0],
  };
  function getSquad() {
    fetch(`/api/squad/${league}`).then(async (e) => {
      const val = await e.json();
      let players = { att: [], mid: [], def: [], gk: [], bench: [] };
      val.players.forEach((e) => {
        players[e.position].push({
          playeruid: e.playeruid,
          starred: e.starred,
          status: e.status,
        });
      });
      setFormation(val.formation);
      setSquad(players);
      setValidFormations(val.validFormations);
    });
  }
  // Gets the players squad
  useEffect(getSquad, [league]);
  // Checks if the player can change to the formation
  function changeToFormation(newFormation) {
    let defenders = newFormation[1] - squad["def"].length;
    let midfielders = newFormation[2] - squad["mid"].length;
    let forwards = newFormation[3] - squad["att"].length;
    return !(defenders >= 0) || !(midfielders >= 0) || !(forwards >= 0);
  }
  return (
    <>
      <Head>
        <title>{`Squad for ` + leagueName}</title>
      </Head>
      <Menu session={session} league={league} />
      <h1>Squad for {leagueName}</h1>
      <p>
        You can have one starred Forward, Midfielder, and Defender. These
        players will then get {starredPercentage}% of the regular amount of
        points.
      </p>
      <InputLabel id="formation-label">Formation</InputLabel>
      <Select
        onChange={(e) => {
          // Used to change the formation
          let newFormation = JSON.parse(e.target.value);
          push(["trackEvent", "New Formation", JSON.stringify(newFormation)]);
          setFormation(newFormation);
          notify("Saving");
          fetch(`/api/squad/${league}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              formation: newFormation,
            }),
          }).then(async (response) => {
            notify(await response.text(), response.ok ? "success" : "error");
          });
        }}
        value={JSON.stringify(formation)}
        id="formation"
        labelId="formation-label"
      >
        {validFormations.map((val) => (
          <MenuItem
            key={JSON.stringify(val)}
            disabled={changeToFormation(val)}
            value={JSON.stringify(val)}
          >
            {val[1]}-{val[2]}-{val[3]}
          </MenuItem>
        ))}
      </Select>
      <h2>Attackers</h2>
      {squad["att"].map(
        (
          e // Used to get the players for the attack
        ) => (
          <Player
            uid={e.playeruid}
            key={e.playeruid}
            league={league}
            starred={e.starred}
            update={getSquad}
            notify={notify}
            status={e.status}
          />
        )
      )}
      <h2>Midfielders</h2>
      {squad["mid"].map(
        (
          e // Used to get the players for the mid
        ) => (
          <Player
            uid={e.playeruid}
            key={e.playeruid}
            league={league}
            starred={e.starred}
            update={getSquad}
            notify={notify}
            status={e.status}
          />
        )
      )}
      <h2>Defense</h2>
      {squad["def"].map(
        (
          e // Used to get the players for the defense
        ) => (
          <Player
            uid={e.playeruid}
            key={e.playeruid}
            league={league}
            starred={e.starred}
            update={getSquad}
            notify={notify}
            status={e.status}
          />
        )
      )}
      <h2>Goalkeeper</h2>
      {squad["gk"].map(
        (
          e // Used to get the player for the goalkeeper
        ) => (
          <Player
            uid={e.playeruid}
            key={e.playeruid}
            league={league}
            update={getSquad}
            notify={notify}
            status={e.status}
          />
        )
      )}
      <h2>Bench</h2>
      {squad["bench"].map(
        (
          e // Used to get the players for the bench
        ) => (
          <Player
            uid={e.playeruid}
            key={e.playeruid}
            field={field}
            league={league}
            update={getSquad}
            notify={notify}
            status={e.status}
          />
        )
      )}
    </>
  );
}

// Gets the users session
export async function getServerSideProps(ctx) {
  const connection = await connect();
  const starredPercentage = await connection
    .query("SELECT starredPercentage FROM leagueSettings WHERE leagueID=?", [
      ctx.query.league,
    ])
    .then((res) => (res.length > 0 ? res[0].starredPercentage : 150));
  connection.end();
  return await redirect(ctx, { starredPercentage });
}
