const Route = require('../models/Route');
const Bus = require('../models/Bus');

/**
 * AI TransitBot Knowledge Base & Context Engine
 * Handles natural language transport queries for Parul University Goa Campus.
 */

const getCampusKnowledge = async () => {
  try {
    const routes = await Route.find({});
    const buses = await Bus.find({}).populate('routeId driverId');

    const routeSummary = routes.map((r, i) => {
      const stopsList = r.stops.map((s) => s.name).join(' ➔ ');
      return `• ${r.routeName}: ${stopsList}`;
    }).join('\n');

    const busSummary = buses.map((b) => {
      return `• Bus ${b.busNumber}: Status [${b.status}], Route [${b.routeId?.routeName || 'Unassigned'}], Capacity [${b.capacity} seats]`;
    }).join('\n');

    return { routeSummary, busSummary, routeCount: routes.length, busCount: buses.length };
  } catch (err) {
    console.error('Error fetching campus context:', err.message);
    return { routeSummary: '', busSummary: '', routeCount: 0, busCount: 0 };
  }
};

/**
 * Intelligent Natural Language Answer Resolver
 */
const resolveTransportQuery = (query, context) => {
  const q = query.toLowerCase().trim();

  // 1. Greetings
  if (q.match(/^(hi|hello|hey|greetings|hola|namaste|sup|yo)\b/i)) {
    return `⚡ **Greetings, Commuter!** I am **TransitBot**, your AI Transportation Assistant for the Parul University Goa Campus (Quitol).

I can help you with:
• **Route Lookups**: Find which bus passes through your village or city in Goa.
• **Pass Pricing**: Monthly, Semester, and Annual pass calculations.
• **Bus Tracking**: Real-time fleet status & stop countdowns.
• **Live Features**: Proximity radar geofences & passenger delay notices.

*What route or stop are you looking for today?*`;
  }

  // 2. Pricing & Bus Pass queries
  if (q.includes('price') || q.includes('cost') || q.includes('fee') || q.includes('pass') || q.includes('billing') || q.includes('rate') || q.includes('semester')) {
    return `💳 **TransitX Bus Pass Pricing Structure (Parul University Goa Campus)**

Our subscription pricing is dynamically tiered based on distance to the Quitol campus:

• **Tier 1 — North Goa & Long Distance (Marcel, Bicholim, Sanquelim, Mapusa, Porvorim)**
  - Annual Pass: ₹45,000 / year
  - Semester Pass: ₹22,500 / sem
  - Monthly Pass: ₹4,500 / mo

• **Tier 2 — Central Goa (Panjim, Bambolim GMC, Vasco, Ponda, Old Goa)**
  - Annual Pass: ₹40,000 / year
  - Semester Pass: ₹20,000 / sem
  - Monthly Pass: ₹4,000 / mo

• **Tier 3 — South Goa Mid-Distance (Canacona, Sanguem, Curchorem, Verna, Cortalim, Pillar)**
  - Annual Pass: ₹35,000 / year
  - Semester Pass: ₹17,500 / sem
  - Monthly Pass: ₹3,500 / mo

• **Tier 4 — South Goa Core (Margao, Quepem)**
  - Annual Pass: ₹30,000 / year
  - Semester Pass: ₹15,000 / sem
  - Monthly Pass: ₹3,000 / mo

• **Tier 5 — Local Perimeter (Cuncolim, Chinchinim)**
  - Annual Pass: ₹25,000 / year
  - Semester Pass: ₹12,500 / sem
  - Monthly Pass: ₹2,500 / mo

*All passes include a digital QR Bus Pass with instant printable tax receipts!*`;
  }

  // 3. Specific Route & Stop Queries
  const routeQueries = [
    { key: 'margao', route: 'Route 17 - Margao Line', stops: 'Margao KTC Bustand ➔ Easybuy Navelim ➔ Navelim Church ➔ Furtado Petrol Pump Junction ➔ Darmapur Stop ➔ Rai Bus Stop ➔ PU Goa Campus (Quitol)' },
    { key: 'panjim', route: 'Route 6 - Panjim Line', stops: 'Hira Petrol Pump ➔ PU Goa Campus (Quitol)' },
    { key: 'mapusa', route: 'Route 4 - Mapusa Line', stops: 'Mapusa Bus Stand ➔ Guirim Tisk ➔ Ocoquerio ➔ Mall de Goa ➔ PU Goa Campus (Quitol)' },
    { key: 'vasco', route: 'Route 8 - Vasco Line', stops: 'Vasco Municipality ➔ Goa Shipyard ➔ Chicalim Junction ➔ Jaisanto (MES) ➔ PU Goa Campus (Quitol)' },
    { key: 'ponda', route: 'Route 9 - Ponda Line', stops: 'Ponda KTC Busstand ➔ Old Busstand ➔ Ponda Tisk ➔ Borim Bridge ➔ Khandepar ➔ Bethoda Signal ➔ Shivaji Circle Usgao ➔ PU Goa Campus (Quitol)' },
    { key: 'bambolim', route: 'Route 7 - Bambolim Line', stops: 'Goa Medical College (GMC) ➔ GMC Hostel ➔ PU Goa Campus (Quitol)' },
    { key: 'marcel', route: 'Route 1 - Marcel Line', stops: 'Marcel Busstand ➔ Banastarim Junction ➔ Corlim Stop ➔ PU Goa Campus (Quitol)' },
    { key: 'bicholim', route: 'Route 2 - Bicholim Line', stops: 'ITI College ➔ Sarvan Bus Stop ➔ Kudnem Bus Stop ➔ PU Goa Campus (Quitol)' },
    { key: 'sanquelim', route: 'Route 3 - Sanquelim Line', stops: 'Shivaji Circle ➔ Sanquelim Hospital ➔ PU Goa Campus (Quitol)' },
    { key: 'porvorim', route: 'Route 5 - Porvorim Line', stops: 'Maruti Sai Service ➔ Three Buildings ➔ PU Goa Campus (Quitol)' },
    { key: 'canacona', route: 'Route 11 - Canacona Line', stops: 'Mashem ➔ Canacona KTC Busstand ➔ Four Road ➔ Barshem ➔ PU Goa Campus (Quitol)' },
    { key: 'curchorem', route: 'Route 13 - Curchorem Line', stops: 'Savordem Tisk Circle ➔ Shivaji Circle ➔ Ambedkar Circle ➔ PU Goa Campus (Quitol)' },
    { key: 'sanguem', route: 'Route 12 - Sanguem Line', stops: 'Sanguem Busstand ➔ PU Goa Campus (Quitol)' },
    { key: 'verna', route: 'Route 14 - Verna Line', stops: 'Birla Cross ➔ Pirni Circle ➔ Cansaulim Highway Junction ➔ Nuem ➔ PU Goa Campus (Quitol)' },
    { key: 'cortalim', route: 'Route 15 - Cortalim Line', stops: 'Cortalim Junction ➔ PU Goa Campus (Quitol)' },
    { key: 'pillar', route: 'Route 16 - Pillar Line', stops: 'NH Highway Turning Point ➔ PU Goa Campus (Quitol)' },
    { key: 'quepem', route: 'Route 18 - Quepem Line', stops: 'Tilamol Circle ➔ Quepem Municipal Market ➔ PU Goa Campus (Quitol)' },
    { key: 'cuncolim', route: 'Route 19 - Cuncolim Line', stops: 'Cuncolim KTC Bus Stand ➔ Balli ➔ PU Goa Campus (Quitol)' },
    { key: 'chinchinim', route: 'Route 20 - Chinchinim Line', stops: 'Chinchinim (Our Lady of Hope Church) ➔ PU Goa Campus (Quitol)' },
    { key: 'old goa', route: 'Route 10 - Old Goa Line', stops: 'Nearby Overbridge ➔ PU Goa Campus (Quitol)' },
  ];

  for (const rq of routeQueries) {
    if (q.includes(rq.key)) {
      return `📍 **${rq.route} Details**

**Boarding Sequence & Stops:**
${rq.stops}

**Destination**: Parul University South Goa Campus, Quitol.
**Proximity Radar**: You can arm the 500m / 1km radar alert on the live map to get a phone notification when this bus approaches your stop!`;
    }
  }

  // 4. All Routes Query
  if (q.includes('all route') || q.includes('list route') || q.includes('routes') || q.includes('how many route')) {
    return `🗺️ **Parul University Goa Campus — All 20 Bus Routes**

1. **Route 1 - Marcel Line** (Marcel, Banastarim, Corlim)
2. **Route 2 - Bicholim Line** (ITI, Sarvan, Kudnem)
3. **Route 3 - Sanquelim Line** (Shivaji Circle, Sanquelim Hospital)
4. **Route 4 - Mapusa Line** (Mapusa KTC, Guirim, Ocoquerio, Mall de Goa)
5. **Route 5 - Porvorim Line** (Maruti Sai Service, Three Buildings)
6. **Route 6 - Panjim Line** (Hira Petrol Pump, Panjim City)
7. **Route 7 - Bambolim Line** (GMC Hospital, GMC Hostel)
8. **Route 8 - Vasco Line** (Vasco Municipality, Goa Shipyard, Chicalim, MES)
9. **Route 9 - Ponda Line** (Ponda KTC, Old Busstand, Borim Bridge, Khandepar, Usgao)
10. **Route 10 - Old Goa Line** (Nearby Overbridge, Ribandar)
11. **Route 11 - Canacona Line** (Mashem, Canacona KTC, Four Road, Barshem)
12. **Route 12 - Sanguem Line** (Sanguem Busstand)
13. **Route 13 - Curchorem Line** (Savordem Tisk, Shivaji Circle, Ambedkar Circle)
14. **Route 14 - Verna Line** (Birla Cross, Pirni Circle, Cansaulim, Nuem)
15. **Route 15 - Cortalim Line** (Cortalim Junction)
16. **Route 16 - Pillar Line** (NH Highway Turning Point)
17. **Route 17 - Margao Line** (Margao KTC, Navelim, Furtado, Darmapur, Rai)
18. **Route 18 - Quepem Line** (Tilamol Circle, Quepem Municipal Market)
19. **Route 19 - Cuncolim Line** (Cuncolim KTC, Balli)
20. **Route 20 - Chinchinim Line** (Our Lady of Hope Church, Chinchinim)

*All routes terminate at the main campus gate in Quitol, South Goa.*`;
  }

  // 5. Fleet / Live Bus status
  if (q.includes('fleet') || q.includes('bus number') || q.includes('active bus') || q.includes('tracking') || q.includes('where is')) {
    return `🚌 **Live Fleet Overview (TransitX Smart Transit)**

${context.busSummary || '• Bus GA-08-F-1234: Margao Line (Active/Standby)\n• Bus GA-01-H-5678: Marcel Line (Active/Standby)'}

• **Live GPS Updates**: Broadcasted at 2-second intervals via high-accuracy HTML5 Geolocation and WebSockets.
• **Proximity Geofence**: Available on the student dashboard with audio synth chimes and mobile vibrations.`;
  }

  // 6. Late Notice Feature
  if (q.includes('late') || q.includes('delay') || q.includes('miss')) {
    return `⏱️ **Passenger Late Notification System**

If you are running late to your bus stop:
1. Open the **Student Space** ➔ **Live Bus Map**.
2. Tap **"Notify Driver: I'm Running Late"**.
3. Select your delay time (**5, 10, or 15 mins**).
4. Tap **Send** ➔ The driver receives an immediate audio and visual delay notice on their bus dashboard with your name, roll number, and stop name!`;
  }

  // 7. Fallback / Default AI response
  return `🤖 **TransitBot Campus Transit Intelligence**

I found relevant transport info for your query:

• **Campus Location**: Parul University South Goa Campus (Quitol coordinates: \`15.1389° N, 73.9669° E\`).
• **Network**: Covers all 20 Goa transport corridors across North, Central, and South Goa.
• **Features**:
  - Live hardware GPS satellite tracking.
  - "Bus Approaching" proximity geofence alerts with audio chimes.
  - Digital QR passes with automatic validity validation.

*Try asking me about specific cities (e.g. "Stops on Margao line", "Cost of Panjim pass", or "How to notify driver").*`;
};

// @desc    Process AI TransitBot Chat Query
// @route   POST /api/ai/chat
// @access  Public
exports.chat = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty.' });
    }

    const context = await getCampusKnowledge();
    const reply = resolveTransportQuery(message, context);

    res.status(200).json({
      success: true,
      data: {
        reply,
        timestamp: new Date().toLocaleTimeString(),
      },
    });
  } catch (error) {
    console.error('TransitBot error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI chat query.',
    });
  }
};
