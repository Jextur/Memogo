
# Google Places API 接入指南 + UI 配色規範（V0 Demo）
*最後更新：2025-08-19 17:01 UTC*

本文件說明如何在 **Travelify（對話式旅遊包）** 的 V0 Demo 中接入 **Google Places API** 以取得景點/餐廳資料，並提供一份 **純色系 UI 配色** 方案（去除漸層）。

---

## 一、目標與範圍
- 以使用者「對話澄清」後的條件（城市、主題偏好、預算）呼叫 Google Places，取得 **候選 POI（景點/餐廳）** 清單。
- 在 **方案生成（A/B/C）** 階段，將 POI 套入行程格局（早/午/晚），並呈現 **預算分布 + 航班/飯店示例卡**。
- 僅用於 **V0 Demo**，以 **Text Search / Nearby Search / Details / Photo** 做最小可用整合。

---

## 二、環境變數
```
GOOGLE_MAPS_API_KEY=你的API_KEY
```

> 建議：在 Google Cloud Console 啟用 **Places API / Maps JavaScript API（如需）**，並針對 **HTTP referrer** 或 **IP** 做金鑰限制。

---

## 三、服務端 API 設計（Next.js App Router, 伺服器端 fetch）

### 1) `/api/places/search`
- **用途**：以 `query` 或 `location+radius` 取得候選 POI（景點/餐廳）。
- **Query 參數**：
  - `query`（如：`Tokyo sushi`、`best ramen in shinjuku`）
  - 或 `location`（`lat,lng`）+ `radius`（公尺，<=50000）+ `type`（如 `restaurant`/`tourist_attraction`）
- **Google 端點（二選一）**：
  - Text Search：`https://maps.googleapis.com/maps/api/place/textsearch/json?query={q}&key={API_KEY}`
  - Nearby Search：`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius={r}&type={type}&key={API_KEY}`

**範例（Next.js Route）**
```ts
// app/api/places/search/route.ts
import { NextRequest } from "next/server";

const GOOGLE = "https://maps.googleapis.com/maps/api/place";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");
  const location = searchParams.get("location"); // "35.6804,139.7690"
  const radius = searchParams.get("radius") ?? "5000";
  const type = searchParams.get("type") ?? "tourist_attraction";
  const key = process.env.GOOGLE_MAPS_API_KEY!;

  let url = "";
  if (query) {
    url = `${GOOGLE}/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
  } else if (location) {
    url = `${GOOGLE}/nearbysearch/json?location=${location}&radius=${radius}&type=${type}&key=${key}`;
  } else {
    return new Response(JSON.stringify({ error: "query or location required" }), { status: 400 });
  }

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();

  // 正規化（僅保留前 10 筆）
  const results = (data.results ?? []).slice(0, 10).map((p: any) => ({
    place_id: p.place_id,
    name: p.name,
    rating: p.rating,
    user_ratings_total: p.user_ratings_total,
    price_level: p.price_level,
    types: p.types,
    address: p.formatted_address ?? p.vicinity,
    location: p.geometry?.location,
    open_now: p.opening_hours?.open_now ?? null,
    photo_ref: p.photos?.[0]?.photo_reference ?? null
  }));

  return Response.json({ results });
}
```

**測試 cURL**
```bash
curl "http://localhost:3000/api/places/search?query=Tokyo%20ramen"
```

---

### 2) `/api/places/details`
- **用途**：取得單一 POI 的細節（網址、電話、營業時間、照片等）。
- **Google 端點**：
  - Details：`https://maps.googleapis.com/maps/api/place/details/json?place_id={id}&fields=name,formatted_address,international_phone_number,website,url,opening_hours,geometry,rating,user_ratings_total,price_level,types,photos&key={API_KEY}`

**範例（Next.js Route）**
```ts
// app/api/places/details/route.ts
import { NextRequest } from "next/server";
const GOOGLE = "https://maps.googleapis.com/maps/api/place";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("place_id");
  const key = process.env.GOOGLE_MAPS_API_KEY!;
  if (!id) return new Response(JSON.stringify({ error: "place_id required" }), { status: 400 });

  const fields = [
    "name","formatted_address","international_phone_number","website","url",
    "opening_hours","geometry","rating","user_ratings_total","price_level","types","photos"
  ].join(",");

  const url = `${GOOGLE}/details/json?place_id=${id}&fields=${fields}&key=${key}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  const r = data.result ?? {};

  const norm = {
    place_id: id,
    name: r.name,
    address: r.formatted_address,
    phone: r.international_phone_number,
    website: r.website,
    maps_url: r.url,
    location: r.geometry?.location,
    opening_hours: r.opening_hours,
    rating: r.rating,
    user_ratings_total: r.user_ratings_total,
    price_level: r.price_level,
    types: r.types,
    photos: (r.photos ?? []).slice(0, 5).map((p: any) => ({
      photo_reference: p.photo_reference,
      width: p.width,
      height: p.height
    }))
  };

  return Response.json({ result: norm });
}
```

**測試 cURL**
```bash
curl "http://localhost:3000/api/places/details?place_id=YOUR_PLACE_ID"
```

---

### 3) `/api/places/photo`
- **用途**：透過 `photo_reference` 取回圖片（Google 以 302 轉址）。
- **Google 端點**：
  - Photo：`https://maps.googleapis.com/maps/api/place/photo?maxwidth={w}&photo_reference={ref}&key={API_KEY}`

**範例（Next.js Route）**
```ts
// app/api/places/photo/route.ts
import { NextRequest } from "next/server";
const GOOGLE = "https://maps.googleapis.com/maps/api/place";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");
  const maxwidth = searchParams.get("maxwidth") ?? "800";
  const key = process.env.GOOGLE_MAPS_API_KEY!;
  if (!ref) return new Response("ref required", { status: 400 });
  const url = `${GOOGLE}/photo?maxwidth=${maxwidth}&photo_reference=${ref}&key=${key}`;
  // 直接 302 轉址
  return Response.redirect(url);
}
```

---

## 四、正規化資料結構（前端/後端共用）
> 以「最小可用」欄位來餵行程排程器與卡片展示。

```ts
type NormalizedPOI = {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  address?: string;
  location?: { lat: number; lng: number };
  open_now?: boolean | null;
  photo_ref?: string | null;
}

type PlaceDetails = NormalizedPOI & {
  phone?: string;
  website?: string;
  maps_url?: string;
  opening_hours?: any;
  photos?: { photo_reference: string; width: number; height: number }[];
}
```

---

## 五、快取與額度建議
- **快取層**：
  - `search` 結果：以 `query` 或 `location+type+radius` 為 key，**1 小時**快取。
  - `details` 結果：以 `place_id` 為 key，**24 小時**快取。
- **避免重複**：對同一 `place_id` 僅在缺欄位時再補打 `details`。
- **錯誤處理**：尊重 `status`（如 `OVER_QUERY_LIMIT`）；顯示替代文案。
- **合規**：遵守 Google Places 服務條款與標示（顯示 “Powered by Google”／來源 icon）。

---

## 六、UI 配色與元件規範（純色、無漸層）
- **主色（背景）**：深紫色 `#2D1B69`
- **輔色（強調/按鈕/高亮）**：金黃色 `#FFD700`
- **中性色（文字/邊框）**：
  - 主要文字 `#F5F5F7`（在深紫背景上有足夠對比）
  - 次要文字 `#C9C9D1`
  - 邊框/分隔 `#3A2A7A`
  - 卡片底 `#241557`

**Tailwind 設定（片段）**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#2D1B69",
          card: "#241557",
          border: "#3A2A7A",
          text: "#F5F5F7",
          mute: "#C9C9D1",
          accent: "#FFD700"
        }
      }
    }
  }
}
```

**基本元件風格**
```css
:root {
  --bg: #2D1B69;
  --card: #241557;
  --border: #3A2A7A;
  --text: #F5F5F7;
  --mute: #C9C9D1;
  --accent: #FFD700;
}

body { background: var(--bg); color: var(--text); }

.button-primary {
  background: var(--accent);
  color: #2D1B69;
  border-radius: 10px;
  padding: 10px 14px;
  font-weight: 700;
}

.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
}

.badge {
  background: rgba(255, 215, 0, 0.12);
  color: var(--accent);
  border: 1px solid rgba(255, 215, 0, 0.35);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 12px;
}
```

**可視化建議**
- 列表用 **卡片** 呈現 POI（名稱、評分、類型、開放狀態），**右上角**放加號加入行程。
- 詳情彈窗顯示 **地址/開放時間/快速導覽按鈕（導航、網站、電話）**。
- 所有重點按鈕（如「加入 Day2 下午」）使用 **金黃色 #FFD700**；其餘次要操作使用描邊卡片樣式（透明底＋金色描邊）。

---

## 七、與對話流程的整合點
- 當使用者回覆「主題偏好/區域」，觸發 `/api/places/search` → 取回候選 POI → 以 **3~6 個**卡片建議顯示。
- 使用者點擊「加入行程」後，將 POI 寫入目前方案的 `itinerary[day].segments` 中；若超出時間區塊，提示替換或移動。
- 在 **方案重生** 時，保留使用者已鎖定的 POI（鎖定標記）。

---

## 八、法規/授權提醒
- 必須遵守 Google Places API 的 **顯示與歸屬規範**。
- 不要在未授權情況下 **儲存或再分發照片像素**；可快取 `photo_reference`，按需動態請求。

---

## 九、下一步（建議）
- 加入 **城市預設範本（City Pack）**，優先用內建 POI，Places 補位。
- 加入 **候選 POI 的「主題標籤」與「行走時間估算」**，讓排程更智能。

——
