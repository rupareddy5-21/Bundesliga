import {
  Button,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
} from "@mui/material";
import { push } from "@socialgouv/matomo-next";
import Head from "next/head";
import { useState } from "react";
import Menu from "../components/Menu";
import connect from "../Modules/database.mjs";
export default function Home({ session, historicalTimes }) {
  const [matchday, setMatchday] = useState(0);
  const [showHidden, setShowHidden] = useState(false);
  // Tracks the kind of download
  function download(type) {
    if (matchday !== "") push(["trackEvent", "Download", "Time", matchday]);
    push(["trackEvent", "Download", "Type", type]);
    push([
      "trackEvent",
      "Download",
      "Show Hidden",
      showHidden ? "true" : "false",
    ]);
  }
  // Generates the download link
  function downloadLink(type) {
    return `/api/download?type=${type}${
      matchday !== 0 ? `&time=${matchday}` : ""
    }${showHidden ? "&showHidden=true" : ""}`;
  }
  return (
    <>
      <Head>
        <title>Download</title>
      </Head>
      <Menu session={session} />
      <h1>Download Data</h1>
      <p>Here you can download the player data for personal use.</p>
      <InputLabel id="timeLabel">Time</InputLabel>
      <Select
        labelId="timeLabel"
        id="time"
        value={matchday}
        onChange={(val) => setMatchday(val.target.value)}
      >
        {historicalTimes.map((e) => {
          let date = new Date(e * 1000);
          return (
            <MenuItem key={e} value={e}>
              {date.toDateString()}
            </MenuItem>
          );
        })}
        <MenuItem value={0}>Latest</MenuItem>
      </Select>
      <br></br>
      <FormControlLabel
        label="Download hidden players in addition to all other ones"
        control={
          <Checkbox
            id="showHidden"
            checked={showHidden}
            onChange={(e) => setShowHidden(e.target.checked)}
          />
        }
      />
      <br></br>
      <ButtonGroup>
        <Button
          onClick={() => {
            download("json");
          }}
        >
          <a href={downloadLink("json")}>Download as JSON</a>
        </Button>
        <Button
          onClick={() => {
            download("csv");
          }}
        >
          <a href={downloadLink("csv")}>Download as CSV</a>
        </Button>
      </ButtonGroup>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const connection = await connect();
  // Gets a list of all the times
  const historicalTimes = (
    await connection.query("SELECT DISTINCT time FROM historicalPlayers")
  ).map((e) => e.time);
  return { props: { historicalTimes } };
}
