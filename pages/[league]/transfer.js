import Menu from "../../components/Menu";
import redirect from "../../Modules/league";
import Head from "next/head";
import { useState, useEffect } from "react";
import { TransferPlayer as Player } from "../../components/Player";
import { push } from "@socialgouv/matomo-next";
import { SessionProvider, useSession } from "next-auth/react";
import connect from "../../Modules/database.mjs";
import Link from "next/link";
import {
  Button,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
} from "@mui/material";

// Shows the amount of transfers left
function TransfersLeft({ ownership, allowedTransfers, transferCount }) {
  const session = useSession();
  const user = session.data ? session.data.user.id : 1;
  return (
    <p>
      {Object.values(ownership).filter(
        (e) => e.filter((e) => e.owner === user).length > 0
      ).length == 0
        ? "Unlimited"
        : allowedTransfers - transferCount}{" "}
      transfers left
    </p>
  );
}
// Used for the selecting and unselecting of a position
function Postion({ position, positions, setPositions }) {
  return (
    <>
      <FormControlLabel
        control={
          <Checkbox
            checked={positions.includes(position)}
            onChange={(e) => {
              e.target.checked
                ? setPositions([...positions, position])
                : setPositions(positions.filter((e2) => e2 != position));
            }}
          />
        }
        label={position}
      />
    </>
  );
}
export default function Home({
  session,
  league,
  allowedTransfers,
  duplicatePlayers,
  notify,
  leagueName,
}) {
  const positionList = ["gk", "def", "mid", "att"];
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [finished, setFinished] = useState(false);
  const [positions, setPositions] = useState(positionList);
  const [money, setMoney] = useState(0);
  const [ownership, setOwnership] = useState({});
  const [transferCount, setTransferCount] = useState(0);
  const [orderBy, setOrderBy] = useState("value");
  const [showHidden, setShowHidden] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [open, setOpen] = useState(true);
  const [clubSearch, setClubSearch] = useState("");
  useEffect(() => {
    search(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, positions, orderBy, showHidden, clubSearch]);
  // Used to get the data for a list of transfers and money
  function transferData() {
    fetch(`/api/transfer/${league}`).then(async (val) => {
      val = await val.json();
      setMoney(val.money);
      setOwnership(val.ownership);
      setTransferCount(val.transferCount);
      setTimeLeft(val.timeLeft);
      setOpen(val.transferOpen);
    });
  }
  // Used to lower the time left by one every second
  useEffect(() => {
    const id = setInterval(
      () => setTimeLeft((timeLeft) => (timeLeft > 0 ? timeLeft - 1 : 0)),
      1000
    );
    return () => {
      clearInterval(id);
    };
  }, []);
  // Used to calculate transfer message
  let transferMessage = (
    <p>
      Transfer Market {open ? "Open" : "Closed"} for{" "}
      {Math.floor(timeLeft / 3600 / 24)} D {Math.floor(timeLeft / 3600) % 24} H{" "}
      {Math.floor(timeLeft / 60) % 60} M {timeLeft % 60} S
    </p>
  );
  useEffect(transferData, [league]);
  // Used to search the isNew is used to check if it should reload everything back from the start
  async function search(isNew) {
    let length = -1;
    if (!isNew) {
      if (finished) {
        return;
      } else {
        length = players.length;
      }
    } else {
      push(["trackEvent", "Search Transfer", "Search Term", searchTerm]);
      push([
        "trackEvent",
        "Search Transfer",
        "Positions",
        JSON.stringify(positions),
      ]);
      push(["trackEvent", "Search Transfer", "Order By", orderBy]);
      push([
        "trackEvent",
        "Search Transfer",
        "Show Hidden",
        JSON.stringify(showHidden),
      ]);
      push(["trackEvent", "Search Transfer", "Club Search", clubSearch]);
      setFinished(false);
    }
    // Gets the data and returns the amount of players found
    const newLength = await fetch(
      `/api/player?${
        isNew ? "" : `limit=${players.length + 10}`
      }&searchTerm=${encodeURIComponent(
        searchTerm
      )}&clubSearch=${encodeURIComponent(
        clubSearch
      )}&positions=${encodeURIComponent(
        JSON.stringify(positions)
      )}&order_by=${orderBy}${showHidden ? "&showHidden=true" : ""}`
    ).then(async (val) => {
      val = await val.json();
      setPlayers(val);
      return val.length;
    });
    if (newLength == length) {
      setFinished(true);
    }
  }
  return (
    <div
      className="main-content"
      onScroll={(e) => {
        // Checks if scrolled to the bottom
        const bottom =
          e.target.scrollHeight - e.target.scrollTop - e.target.clientHeight;
        // Checks if there are only 2 players left that are not shown and if true requests 10 more players
        if (bottom < (e.target.scrollHeight / players.length) * 2) {
          search(false);
        }
      }}
    >
      <Head>
        <title>{`Transfers for ` + leagueName}</title>
      </Head>
      <Menu session={session} league={league} />
      <h1>Transfers for {leagueName}</h1>
      <SessionProvider session={session}>
        <TransfersLeft
          ownership={ownership}
          allowedTransfers={allowedTransfers}
          transferCount={transferCount}
        />
      </SessionProvider>
      <p>Money left: {money / 1000000}M</p>
      {transferMessage}
      <TextField
        onChange={(val) => {
          setSearchTerm(val.target.value);
        }}
        val={searchTerm}
        label="Search Player"
        id="searchPlayer"
      ></TextField>
      <TextField
        onChange={(val) => {
          setClubSearch(val.target.value);
        }}
        val={clubSearch}
        id="searchClub"
        label="Search Club"
        helperText="Use the acronymn ex: FCB, VFB"
      ></TextField>
      <br></br>
      <FormLabel id="orderLabel">Search Order: </FormLabel>
      <Select
        value={orderBy}
        onChange={(val) => setOrderBy(val.target.value)}
        id="order"
        labelId="orderLabel"
      >
        {["value", "total_points", "average_points", "last_match"].map(
          (val) => (
            <MenuItem key={val} value={val}>
              {val}
            </MenuItem>
          )
        )}
      </Select>
      <br></br>
      <FormLabel component="legend">
        Positions to Search(Uncheck to filter out)
      </FormLabel>
      <FormGroup>
        {positionList.map((position) => (
          <Postion
            key={position}
            position={position}
            positions={positions}
            setPositions={setPositions}
          />
        ))}
      </FormGroup>
      <FormControlLabel
        control={
          <Switch
            id="showHidden"
            onChange={(e) => {
              setShowHidden(e.target.checked);
            }}
            checked={showHidden}
          />
        }
        label="Show Hidden Players"
      />
      <p>
        Yellow background means attendance unknown, red background that the
        player is not attending, and purple/pink that the player will not earn
        points anytime soon also known as a hidden player(Sell these players).
      </p>
      <Link href="/download">
        <Button>Download Player Data</Button>
      </Link>
      <SessionProvider session={session}>
        {players.map((val) => (
          <Player
            key={val}
            uid={val}
            money={money}
            ownership={ownership[val]}
            league={league}
            transferLeft={transferCount < allowedTransfers}
            allOwnership={ownership}
            transferData={transferData}
            open={open}
            duplicatePlayers={duplicatePlayers}
            notify={notify}
          />
        ))}
      </SessionProvider>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const connection = await connect();
  // Gets the amount of allowed transfers
  const [allowedTransfers, duplicatePlayers] = await connection
    .query(
      "SELECT transfers, duplicatePlayers FROM leagueSettings WHERE leagueID=?",
      [ctx.params.league]
    )
    .then((result) =>
      result.length > 0
        ? [result[0].transfers, result[0].duplicatePlayers]
        : [0, 0]
    );
  connection.end();
  return await redirect(ctx, { allowedTransfers, duplicatePlayers });
}
