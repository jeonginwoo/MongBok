const x = 71.2;
const y = 100 - x;

export const layouts = {  // layouts[viewCount][layoutType][zoneType][zoneId]
  4: {
    layout1: {
      view: {
        1: { id: 1, type: "view", style: { top: "0%", left: "0%", width: `${x}%`, height: `${x}%` } },
        2: { id: 2, type: "view", style: { top: `${x}%`, left: "0%", width: `${y}%`, height: `${y}%` } },
        3: { id: 3, type: "view", style: { top: `${x}%`, left: `${y}%`, width: `${y}%`, height: `${y}%` } },
        4: { id: 4, type: "view", style: { top: `${x}%`, left: `${y * 2}%`, width: `${y}%`, height: `${y}%` } },
      },
      chat: {
        1: { id: 1, type: "chat", style: { top: "0%", left: `${x}%`, width: `${y * 3 - x}%`, height: `${x}%` } },
        2: { id: 2, type: "chat", style: { top: "0%", left: `${y * 3}%`, width: `${100 - y * 3}%`, height: "34%" } },
        3: { id: 3, type: "chat", style: { top: "34%", left: `${y * 3}%`, width: `${100 - y * 3}%`, height: "33%" } },
        4: { id: 4, type: "chat", style: { top: "67%", left: `${y * 3}%`, width: `${100 - y * 3}%`, height: "33%" } },
      },
    }
  }
};
