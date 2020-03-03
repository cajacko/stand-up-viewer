import React from "react";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";

function useStoredState(id, defaultValue) {
  let storedValue = localStorage.getItem(id);
  if (storedValue) storedValue = JSON.parse(storedValue);

  const [value, setValue] = React.useState(storedValue || defaultValue);

  return [
    value,
    newValue => {
      localStorage.setItem(id, JSON.stringify(newValue));
      return setValue(newValue);
    }
  ];
}

function App() {
  const [url, setUrl] = useStoredState("url", "");
  const [inputValue, setInputValue] = React.useState(url);
  const [data, setData] = useStoredState("data", null);
  const [activeListIndex, setActiveListIndex] = useStoredState(
    "activeListIndex",
    2
  );
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [status, setStatus] = React.useState(data ? "SUCCESS" : "INIT");

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const actualActiveListIndex =
    data && data.lists[activeListIndex] ? activeListIndex : 0;
  const activeListData = data && data.lists[actualActiveListIndex];

  function onSubmit(e) {
    e.preventDefault();
    setUrl(inputValue);
  }

  function fetchData() {
    if (!url || url === "") return;

    setStatus("LOADING");

    fetch(url)
      .then(res => res.json())
      .then(data => {
        const cardsByList = {};

        data.cards.forEach(card => {
          if (card.closed) return;
          if (card.name.trim().toLowerCase() === "set notes") return;

          if (!cardsByList[card.idList]) cardsByList[card.idList] = [];

          let desc = card.desc.split("\n");

          const slicePoint = desc.findIndex(
            text => text.trim().toLowerCase() === "---"
          );

          if (slicePoint >= 0) {
            desc = desc.slice(0, slicePoint);
          }

          desc = desc.join("\n");

          cardsByList[card.idList].push({
            id: card.id,
            desc,
            name: card.name,
            pos: card.pos
          });
        });

        return {
          id: data.id,
          name: data.name,
          lists: data.lists
            .filter(list => !list.closed)
            .sort((a, b) => a.pos - b.pos)
            .map(list => ({
              id: list.id,
              name: list.name,
              cards: (cardsByList[list.id] || []).sort((a, b) => a.pos - b.pos)
            }))
        };
      })
      .then(setData)
      .then(() => {
        setStatus("SUCCESS");
      })
      .catch(() => {
        setStatus("ERROR");
      });
  }

  React.useEffect(() => {
    fetchData();
  }, [url]);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <form
        onSubmit={onSubmit}
        style={{ display: "flex", alignItems: "flex-end" }}
      >
        <TextField
          label="Trello .json url"
          type="text"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button
          onSubmit={onSubmit}
          onClick={onSubmit}
          variant="contained"
          style={{ marginLeft: 20 }}
        >
          Set
        </Button>
      </form>
      {data && (
        <>
          <Button
            aria-controls="simple-menu"
            aria-haspopup="true"
            onClick={handleClick}
            variant="contained"
            style={{ margin: "20px 0" }}
          >
            Select List
          </Button>
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            {data.lists.map(({ id, name }, i) => (
              <MenuItem id={id} onClick={() => setActiveListIndex(i)}>
                {name}
              </MenuItem>
            ))}
          </Menu>
        </>
      )}
      {activeListData ? (
        <div>
          <Typography variant="h4" component="h1" gutterBottom>
            {activeListData.name}
          </Typography>
          <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {activeListData.cards.map(({ id, name, desc }) => (
              <li key={id}>
                <Typography variant="h5" component="h3" gutterBottom>
                  {name}
                </Typography>
                {desc.split("\n").map((text, i) => (
                  <Typography key={i} variant="body1" gutterBottom>
                    {text}
                  </Typography>
                ))}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <Typography variant="body1">{status}</Typography>
      )}
    </div>
  );
}

export default App;
