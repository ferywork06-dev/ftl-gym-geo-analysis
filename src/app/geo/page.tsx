"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MapPin, Search, X, ChevronDown, Layers, Target, Star, Building2 } from "lucide-react";

// FTL Branch data (all 54 branches with real coordinates)
const FTL_BRANCHES = [
  { name: "FTL GYM Kerobokan", code: "KER", region: "Bali", city: "Badung", lat: -8.6480641, lng: 115.170502, place_id: "ChIJbYdjOpg50i0RDQNiQcLtuCc", address: "Jl. Raya Kerobokan No.777, Kerobokan Kaja, Badung" },
  { name: "FTL GYM Teuku Umar", code: "TU", region: "Bali", city: "Denpasar", lat: -8.679189899999999, lng: 115.2044016, place_id: "ChIJgQdrf3JB0i0RSHj-QcH5JhA", address: "Jl. Teuku Umar No.182, Denpasar" },
  { name: "FTL GYM Ahmad Yani", code: "AY", region: "Bandung", city: "Bandung", lat: -6.916897800000001, lng: 107.628408, place_id: "ChIJ7SlD3rnnaC4RZnp4oiA3ogI", address: "Jl. A. Yani No.254, Bandung" },
  { name: "FTL GYM Dago", code: "DAG", region: "Bandung", city: "Bandung", lat: -6.8888649, lng: 107.6130779, place_id: "ChIJx_YcVhDnaC4R-LT-GCvLXE0", address: "Jl. Ir. H. Juanda No.151, Bandung" },
  { name: "FTL GYM Merdeka", code: "MER", region: "Bandung", city: "Bandung", lat: -6.9086311, lng: 107.6103133, place_id: "ChIJITUmwgPnaC4Rqqo4hHgO2Yc", address: "Jl. Merdeka No.35, Bandung" },
  { name: "FTL GYM Pasir Koja", code: "PK", region: "Bandung", city: "Bandung", lat: -6.9288887, lng: 107.5809587, place_id: "ChIJabQgYe7naC4RTaXGZM78BVs", address: "Jl. Terusan Pasirkoja No.275, Bandung" },
  { name: "FTL GYM Soetta Kopo", code: "SK", region: "Bandung", city: "Bandung", lat: -6.9463442, lng: 107.5905193, place_id: "ChIJ46lh7AnpaC4RxYDzEjhwfFY", address: "Jl. Soekarno-Hatta No.172, Bandung" },
  { name: "FTL GYM Sukajadi", code: "SUK", region: "Bandung", city: "Bandung", lat: -6.879208299999999, lng: 107.5961239, place_id: "ChIJxyniY5jnaC4RRPlbR6LwzWY", address: "Jl. Sukajadi No.207, Bandung" },
  { name: "FTL GYM KBP", code: "KBP", region: "Bandung", city: "Bandung Barat", lat: -6.856080899999999, lng: 107.489644, place_id: "ChIJ434AgBnlaC4R8XczvsbLGPE", address: "Kota Baru Parahyangan, Bandung Barat" },
  { name: "FTL GYM Pahlawan", code: "PAH", region: "Bogor", city: "Bogor", lat: -6.6079877, lng: 106.7965521, place_id: "ChIJrS86MTnFaS4R0vn-js5_xrs", address: "Jl. Pahlawan No.34, Bogor" },
  { name: "FTL GYM Pajajaran", code: "PAJ", region: "Bogor", city: "Bogor", lat: -6.5726514, lng: 106.8086884, place_id: "ChIJq-QOWCfFaS4Rl1i1NUm4wmA", address: "Jl. Raya Pajajaran No.38, Bogor" },
  { name: "FTL GYM Bekasi", code: "BEK", region: "Jabodetabek", city: "Bekasi", lat: -6.242507700000001, lng: 107.0049463, place_id: "ChIJYXTLqBaNaS4RIsKRIO8EUB8", address: "Jl. Insinyur H. Juanda No.91, Bekasi" },
  { name: "FTL GYM Cibubur", code: "CIB", region: "Jabodetabek", city: "Bekasi", lat: -6.3751115, lng: 106.9136558, place_id: "ChIJG6jhncWTaS4ROnQQ4bxVyqE", address: "Jl. Alternatif Cibubur No.15A, Bekasi" },
  { name: "FTL GYM Cikarang", code: "CIK", region: "Jabodetabek", city: "Bekasi", lat: -6.2980693, lng: 107.149344, place_id: "ChIJmxfCeXabaS4RayXR6vpzk1E", address: "Plaza Jababeka, Cikarang Utara" },
  { name: "FTL GYM Galaxy", code: "GAL", region: "Jabodetabek", city: "Bekasi", lat: -6.269439200000001, lng: 106.9716393, place_id: "ChIJw3dX-WKNaS4Rs0rEVe6jj-Y", address: "Jl. Pulo Sirih Utama, Bekasi Selatan" },
  { name: "FTL GYM Kalimalang", code: "KAL", region: "Jabodetabek", city: "Bekasi", lat: -6.2495058, lng: 106.9552907, place_id: "ChIJb2qX6P2NaS4RqWWMK0JiX_s", address: "Jl. Raya Kalimalang No.68, Bekasi" },
  { name: "FTL GYM Mustika Jaya", code: "MJ", region: "Jabodetabek", city: "Bekasi", lat: -6.2845685, lng: 107.0300011, place_id: "ChIJX0Nu0_qPaS4RujJz0DVWKMc", address: "Jl. Mutiara Gading Timur Raya, Mustikajaya" },
  { name: "FTL GYM Pondok Gede", code: "PG", region: "Jabodetabek", city: "Bekasi", lat: -6.284261, lng: 106.9258831, place_id: "ChIJ3duOt-SNaS4RoHIE-g4kT9Q", address: "Jl. Raya Jati Makmur No.124, Pondok Gede" },
  { name: "FTL GYM Depok Lama", code: "DL", region: "Jabodetabek", city: "Depok", lat: -6.4076808, lng: 106.8178766, place_id: "ChIJtXhXEk3raS4Rgz1W3Cr9j5U", address: "Jl. Kartini No.14, Depok" },
  { name: "FTL GYM Shila Sawangan", code: "SS", region: "Jabodetabek", city: "Depok", lat: -6.4015889, lng: 106.7445313, place_id: "ChIJxW3G9xnpaS4R6pOBluNBgww", address: "Senopati Boulevard Shilla, Sawangan" },
  { name: "FTL GYM Arjuna", code: "ARJ", region: "Jabodetabek", city: "Jakarta Barat", lat: -6.1849145, lng: 106.7834866, place_id: "ChIJtbYZLeP3aS4Rv_Fgx4kxUuI", address: "Jl. Arjuna Utara No.42E, Jakarta Barat" },
  { name: "FTL GYM Citra Garden", code: "CG", region: "Jabodetabek", city: "Jakarta Barat", lat: -6.143503, lng: 106.6982519, place_id: "ChIJh4f_zEwDai4RRFI3dDJazsg", address: "Jl. Peta Barat No.72, Kalideres" },
  { name: "FTL GYM Green Garden", code: "GG", region: "Jabodetabek", city: "Jakarta Barat", lat: -6.1652307, lng: 106.7626968, place_id: "ChIJpWAkESj3aS4RuNq7bsIzvGs", address: "Jl. Panjang Arteri Klp. Dua Raya, Jakarta Barat" },
  { name: "FTL GYM Kemanggisan", code: "KEM", region: "Jabodetabek", city: "Jakarta Barat", lat: -6.1986931, lng: 106.7820129, place_id: "ChIJW2GJTuP3aS4RCbe_v8tA2yw", address: "Jl. Raya Kb. Jeruk No.18, Jakarta Barat" },
  { name: "FTL GYM Puri", code: "PUR", region: "Jabodetabek", city: "Jakarta Barat", lat: -6.188747600000001, lng: 106.7411868, place_id: "ChIJe3qHxln3aS4RCIP5ccCc-NQ", address: "Jl. Kembang Kerep No.3, Kembangan" },
  { name: "FTL GYM Tj Duren", code: "TD", region: "Jabodetabek", city: "Jakarta Barat", lat: -6.1739627, lng: 106.7855181, place_id: "ChIJ9-2pi-v3aS4RBYV4EOcEd2o", address: "Jl. Tanjung Duren Raya No.21, Jakarta Barat" },
  { name: "FTL GYM Tomang", code: "TOM", region: "Jabodetabek", city: "Jakarta Barat", lat: -6.1765367, lng: 106.8012897, place_id: "ChIJ8Q7yZoH3aS4RVzZIScCrIos", address: "Jl. Tomang Raya No.40A, Jakarta Barat" },
  { name: "FTL GYM Agora", code: "AGO", region: "Jabodetabek", city: "Jakarta Pusat", lat: -6.1987901, lng: 106.8218375, place_id: "ChIJ_96Idon1aS4RBs_7e9VcDyo", address: "Agora Mall, Jl. M.H. Thamrin No.10" },
  { name: "FTL GYM Bendungan Hilir", code: "BH", region: "Jabodetabek", city: "Jakarta Pusat", lat: -6.2086843, lng: 106.8120209, place_id: "ChIJhy0LQNH3aS4R6i-O_OJkdJk", address: "Jl. Bendungan Hilir No.118, Jakarta Pusat" },
  { name: "FTL GYM Kebon Sirih", code: "KS", region: "Jabodetabek", city: "Jakarta Pusat", lat: -6.183341899999999, lng: 106.8282124, place_id: "ChIJm1u0EwAFai4RubTBOfQ-PeA", address: "Jl. Kebon Sirih No.41-43, Menteng" },
  { name: "FTL GYM Menteng", code: "MEN", region: "Jabodetabek", city: "Jakarta Pusat", lat: -6.1877917, lng: 106.8252638, place_id: "ChIJTeVtsKf1aS4Ri4bzs2tZG-E", address: "Jl. H. Agus Salim No.65, Menteng" },
  { name: "FTL GYM Blok M", code: "BM", region: "Jabodetabek", city: "Jakarta Selatan", lat: -6.2426794, lng: 106.7994013, place_id: "ChIJOxkyh0HxaS4RFhjVwYkC-YM", address: "Jl. Sunan Kalijaga No.2, Blok M" },
  { name: "FTL GYM Gandaria", code: "GAN", region: "Jabodetabek", city: "Jakarta Selatan", lat: -6.2430088, lng: 106.7877195, place_id: "ChIJ8bd9S6XxaS4RGuM_YPD-ORs", address: "Jl. Gandaria 1 No.336, Kebayoran Baru" },
  { name: "FTL GYM Mampang", code: "MAM", region: "Jabodetabek", city: "Jakarta Selatan", lat: -6.249517099999999, lng: 106.8260697, place_id: "ChIJ2eU_DjXzaS4RaMcqYJTlO-k", address: "Jl. Mampang Prpt. Raya No.90, Jakarta Selatan" },
  { name: "FTL GYM Pasar Minggu", code: "PM", region: "Jabodetabek", city: "Jakarta Selatan", lat: -6.2865943, lng: 106.8435514, place_id: "ChIJuQ5K_hTzaS4RmTgxFMkwJ6w", address: "Jl. Raya Pasar Minggu No.25, Jakarta Selatan" },
  { name: "FTL GYM Satrio", code: "SAT", region: "Jabodetabek", city: "Jakarta Selatan", lat: -6.2184726, lng: 106.8197403, place_id: "ChIJ0SH5UADzaS4RsfPWfw6kjd0", address: "Jl. Prof. DR. Satrio No.275, Kuningan" },
  { name: "FTL GYM SCBD", code: "SCB", region: "Jabodetabek", city: "Jakarta Selatan", lat: -6.2262888, lng: 106.8071618, place_id: "ChIJ5WKcLBXxaS4R5ORZ9S_V70g", address: "Jl. Jend. Sudirman kav 52-53, SCBD" },
  { name: "FTL GYM Tebet", code: "TEB", region: "Jabodetabek", city: "Jakarta Selatan", lat: -6.226541999999999, lng: 106.8546583, place_id: "ChIJx-WmChzzaS4RlPOVOnWssrI", address: "Jl. Tebet Utara Dalam No.19, Tebet" },
  { name: "FTL GYM Pondok Bambu", code: "PB", region: "Jabodetabek", city: "Jakarta Timur", lat: -6.2183871, lng: 106.9000718, place_id: "ChIJkSZZvZjzaS4RN5z9vl2ipOE", address: "Jl. Pahlawan Revolusi No.11, Pondok Bambu" },
  { name: "FTL GYM Rawamangun", code: "RAW", region: "Jabodetabek", city: "Jakarta Timur", lat: -6.1932066, lng: 106.8961363, place_id: "ChIJK86tgxP1aS4RhLudEXuTDGI", address: "Jl. Pemuda, Jati, Pulo Gadung" },
  { name: "FTL GYM Gading Sunter", code: "GS", region: "Jabodetabek", city: "Jakarta Utara", lat: -6.1535582, lng: 106.8864547, place_id: "ChIJfbBk1RD1aS4R-6vu1pFWH0Q", address: "Jl. Yos Sudarso No.84, Sunter" },
  { name: "FTL GYM Gunung Sahari", code: "GS2", region: "Jabodetabek", city: "Jakarta Utara", lat: -6.14007, lng: 106.83336, place_id: "ChIJ3VtngiH1aS4Rf9bMFCjyJjc", address: "Jl. Gn. Sahari Pademangan No.14D, Jakarta Utara" },
  { name: "FTL GYM Cipondoh", code: "CI2", region: "Jabodetabek", city: "Tangerang", lat: -6.1849407, lng: 106.6453871, place_id: "ChIJS_jMfBT5aS4RSqlu1mydNn0", address: "Jl. KH. Hasyim Ashari No.26, Tangerang" },
  { name: "FTL GYM Greenlake City", code: "GC", region: "Jabodetabek", city: "Tangerang", lat: -6.1905001, lng: 106.7027024, place_id: "ChIJv1tF40_5aS4RX6fftIxI6BI", address: "Jl. Green Lake City Boulevard, Cipondoh" },
  { name: "FTL GYM Alam Sutera", code: "AS", region: "Jabodetabek", city: "Tangerang Selatan", lat: -6.232660699999999, lng: 106.6598319, place_id: "ChIJ4buD0v37aS4RaTeum0RjZkI", address: "Jl. Jalur Sutera No.KAV 27A, Alam Sutera" },
  { name: "FTL GYM Ciputat", code: "CIP", region: "Jabodetabek", city: "Tangerang Selatan", lat: -6.312318599999999, lng: 106.753405, place_id: "ChIJTyjhFjjvaS4RAxUY_S22ISk", address: "Ciputat Indah Permai, Jl. Ir H. Juanda No.18" },
  { name: "FTL GYM Cirendeu", code: "CIR", region: "Jabodetabek", city: "Tangerang Selatan", lat: -6.306010000000001, lng: 106.7727498, place_id: "ChIJ_ZdbXJzvaS4Ry1FBLwSe9Ak", address: "Jl. Raya Cirendeu No.43, Ciputat Timur" },
  { name: "FTL GYM Pamulang", code: "PAM", region: "Jabodetabek", city: "Tangerang Selatan", lat: -6.3496044, lng: 106.7403204, place_id: "ChIJzU5Gzy_vaS4R6IZmpnX1KYE", address: "Jl. Dr. Setiabudi No.17, Pamulang" },
  { name: "FTL GYM Pondok Indah", code: "PI", region: "Jabodetabek", city: "Tangerang Selatan", lat: -6.2701568, lng: 106.7749136, place_id: "ChIJmxopifXxaS4R34cmVd68QT8", address: "Jl. Ciputat Raya No.63, Pondok Pinang" },
  { name: "FTL Pilates Reserve Gading Serpong", code: "GS3", region: "Jabodetabek", city: "Tangerang Selatan", lat: -6.2426138, lng: 106.6212928, place_id: "ChIJDatrtAj9aS4RmhkBkS_k20k", address: "Ruko Paramount, Gading Serpong" },
  { name: "FTL GYM A.R Hakim", code: "AH", region: "Surabaya", city: "Surabaya", lat: -7.289143200000001, lng: 112.7796194, place_id: "ChIJYzHaC8v71y0RgWbURvYXPFg", address: "Arief Rahman Hakim No.93, Sukolilo" },
  { name: "FTL GYM Ciputra World", code: "CW", region: "Surabaya", city: "Surabaya", lat: -7.293706299999998, lng: 112.719232, place_id: "ChIJEdYOVfT71y0RXJU4URfUwnE", address: "Gunung Sari, Dukuhpakis, Surabaya" },
  { name: "FTL GYM Gubeng", code: "GUB", region: "Surabaya", city: "Surabaya", lat: -7.2717135, lng: 112.7485476, place_id: "ChIJHaEEvmX_1y0Rfs7uOLH93yU", address: "Gubeng, Surabaya" },
];

const REGION_COLORS: Record<string, string> = {
  "Jabodetabek": "#2a2320",
  "Bandung": "#2f7d55",
  "Bali": "#b07d2d",
  "Bogor": "#2563eb",
  "Surabaya": "#b0392d",
};

type Branch = typeof FTL_BRANCHES[0];
type PlaceResult = {
  name: string;
  vicinity: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  business_status?: string;
  geometry: { location: { lat: number; lng: number } };
  distance_road_m?: number | null;
};
type GeoAnalysis = {
  branch: Branch;
  places: PlaceResult[];
  error?: string;
  loading: boolean;
  fromCache?: boolean;
  cachedAt?: string;
  nearbyBranchDistances?: Record<string, number | null>;
};

const POI_CATEGORIES: { label: string; key: string; color: string; badge?: string }[] = [
  // --- Priority ---
  { label: "Kompetitor",        key: "competitor",   color: "#dc2626", badge: "🔴 Kompetitor" },
  { label: "Gym / Fitness",     key: "gym",          color: "#f97316", badge: "Gym Lainnya" },
  { label: "Perumahan / Hunian",key: "residential",  color: "#16a34a" },
  // --- FTL Terdekat disisipkan di render ---
  // --- Sisanya ---
  { label: "Mall",              key: "mall",          color: "#2563eb" },
  { label: "Perkantoran",       key: "office",        color: "#374151" },
  { label: "Kampus",            key: "university",    color: "#b07d2d" },
  { label: "Sekolah Swasta",    key: "school",        color: "#d97706" },
  { label: "Restoran",          key: "restaurant",    color: "#2f7d55" },
  { label: "Café",              key: "cafe",          color: "#0891b2" },
  { label: "Hotel Bintang 4–5", key: "hotel45",       color: "#7c3aed", badge: "★★★★★" },
  { label: "Hotel Bintang 2–3", key: "hotel23",       color: "#9333ea", badge: "★★★" },
  { label: "Hotel Budget",      key: "hotel_budget",  color: "#a78bfa", badge: "Budget" },
];

const LUXURY_HOTEL_KEYWORDS = ["grand", "novotel", "marriott", "hilton", "sheraton", "hyatt", "sofitel", "pullman", "kempinski", "ritz", "four seasons", "intercontinental", "aryaduta", "savoy", "swiss-bel", "aston", "harris", "mercure", "doubletree", "ibis styles", "santika premiere", "the luxton", "the summit"];
const BUDGET_HOTEL_KEYWORDS = ["reddoorz", "oyo", "hostel", "losmen", "penginapan", "guest house", "guesthouse", "backpacker", "kost", "melati"];
const RESIDENTIAL_TYPES = ["housing_complex", "housing_authority", "apartment_complex"];
const RESIDENTIAL_NAME_KEYWORDS = ["perumahan", "regency", "residence", "residences", "cluster", "komplek perumahan", "apartemen", "apartment", "housing"];

const COMPETITOR_BRANDS = ["celebrity fitness", "osbond", "fitx", "will fitness", "willfitness", "fitness first", "anytime fitness", "fithub"];
const GYM_KEYWORDS = ["gym", "fitness", "crossfit", "pilates", "yoga studio", "boxing", "muay thai", "athletic", "aerobik", "aerobic"];
const GYM_EXCLUSIONS = ["spa", "beauty", "salon", "family club", "poto", "foto", "copy", "food", "restaurant", "cafe", "sanggar", "kecantikan"];

function classifyHotel(place: PlaceResult): "hotel45" | "hotel23" | "hotel_budget" {
  const name = place.name.toLowerCase();
  if (BUDGET_HOTEL_KEYWORDS.some(k => name.includes(k))) return "hotel_budget";
  if (LUXURY_HOTEL_KEYWORDS.some(k => name.includes(k))) return "hotel45";
  if (place.price_level != null) {
    if (place.price_level >= 3) return "hotel45";
    if (place.price_level >= 2) return "hotel23";
    return "hotel_budget";
  }
  if (place.rating != null) {
    if (place.rating >= 4.3 && (place.user_ratings_total ?? 0) > 200) return "hotel45";
    if (place.rating >= 3.8) return "hotel23";
    return "hotel_budget";
  }
  return "hotel23";
}

function getPlaceKey(place: PlaceResult): string | null {
  const t = place.types;
  const name = place.name.toLowerCase();

  // Hotel first — hotels often carry restaurant/cafe subtypes
  if (t.includes("lodging")) return classifyHotel(place);

  // If place has gym type, handle it here — don't let it fall through to other categories
  if (t.includes("gym") || t.includes("health")) {
    const isExcluded = GYM_EXCLUSIONS.some(k => name.includes(k));
    if (!isExcluded && COMPETITOR_BRANDS.some(k => name.includes(k))) return "competitor";
    if (!isExcluded && (name.includes("gym") || name.includes("fitness"))) return "gym";
    return null; // gym-typed but irrelevant name — skip entirely
  }
  // Non-gym-typed but name matches competitor or gym keyword
  if (COMPETITOR_BRANDS.some(k => name.includes(k))) return "competitor";
  if ((name.includes("gym") || name.includes("fitness")) && !GYM_EXCLUSIONS.some(k => name.includes(k))) return "gym";

  if (t.includes("shopping_mall") && (name.includes("mall") || name.includes("plaza") || name.includes("square") || name.includes("pusat perbelanjaan") || name.includes("city walk") || name.includes("trade center"))) return "mall";

  // Residential: Google housing type OR name keyword (for keyword-search results)
  if (RESIDENTIAL_TYPES.some(type => t.includes(type)) || RESIDENTIAL_NAME_KEYWORDS.some(k => name.includes(k))) return "residential";

  if (t.includes("university")) return "university";
  if (t.includes("school") || t.includes("primary_school") || t.includes("secondary_school")) return "school";
  if (t.includes("restaurant") || t.includes("meal_delivery") || t.includes("meal_takeaway")) return "restaurant";
  if (t.includes("cafe") || t.includes("bakery") || t.includes("bar")) return "cafe";
  if (t.includes("insurance_agency") || t.includes("accounting") || t.includes("real_estate_agency")) return "office";
  return null;
}

function categorizePlaces(places: PlaceResult[]) {
  const result: Record<string, PlaceResult[]> = {};
  POI_CATEGORIES.forEach(c => { result[c.key] = []; });
  for (const p of places) {
    const key = getPlaceKey(p);
    if (key && result[key] !== undefined) result[key].push(p);
  }
  return result;
}

const RADIUS_OPTIONS = [500, 1000, 2000, 3000, 5000];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function GeoPage() {
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [radius, setRadius] = useState(1000);
  const [apiKey, setApiKey] = useState("");
  const [showApiInput, setShowApiInput] = useState(false);
  const [analysis, setAnalysis] = useState<GeoAnalysis | null>(null);
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [overlaps, setOverlaps] = useState<{ a: Branch; b: Branch; dist: number }[]>([]);
  const [clearingCache, setClearingCache] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const clearCache = useCallback(async (branchCode?: string) => {
    setClearingCache(true);
    try {
      const url = branchCode ? `/api/geo-cache?branchCode=${branchCode}` : "/api/geo-cache";
      await fetch(url, { method: "DELETE" });
      if (branchCode && analysis?.branch.code === branchCode) {
        setAnalysis(prev => prev ? { ...prev, fromCache: false, cachedAt: undefined } : prev);
      }
    } finally {
      setClearingCache(false);
    }
  }, [analysis]);

  const regions = Array.from(new Set(FTL_BRANCHES.map(b => b.region)));
  const filtered = FTL_BRANCHES.filter(b => {
    const matchRegion = regionFilter === "all" || b.region === regionFilter;
    const matchSearch = !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRegion && matchSearch;
  });

  // Calculate overlapping branches
  useEffect(() => {
    const found: { a: Branch; b: Branch; dist: number }[] = [];
    for (let i = 0; i < FTL_BRANCHES.length; i++) {
      for (let j = i + 1; j < FTL_BRANCHES.length; j++) {
        const dist = haversineKm(FTL_BRANCHES[i].lat, FTL_BRANCHES[i].lng, FTL_BRANCHES[j].lat, FTL_BRANCHES[j].lng);
        if (dist < radius / 1000) {
          found.push({ a: FTL_BRANCHES[i], b: FTL_BRANCHES[j], dist });
        }
      }
    }
    setOverlaps(found.sort((a, b) => a.dist - b.dist));
  }, [radius]);

  const fetchNearbyPlaces = useCallback(async (branch: Branch) => {
    if (!apiKey) {
      setShowApiInput(true);
      setSelectedBranch(branch);
      setAnalysis({ branch, places: [], loading: false });
      return;
    }

    setAnalysis({ branch, places: [], loading: true });
    setSelectedBranch(branch);

    // Pre-compute nearby FTL branches (haversine < 5km) to get road distances for them
    const nearbyBranchCoords = FTL_BRANCHES
      .filter(b => b.code !== branch.code)
      .map(b => ({ ...b, dist: haversineKm(branch.lat, branch.lng, b.lat, b.lng) }))
      .filter(b => b.dist < 5)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 5)
      .map(b => ({ lat: b.lat, lng: b.lng, code: b.code }));

    try {
      const res = await fetch("/api/places-nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat: branch.lat, lng: branch.lng, radius, apiKey, branchCode: branch.code, nearbyBranchCoords }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAnalysis({ branch, places: [], error: data.error ?? "Gagal memuat Places API", loading: false });
      } else {
        // Exclude the selected outlet itself from results
        const places = (data.results ?? []).filter(
          (p: PlaceResult & { place_id?: string }) => p.place_id !== branch.place_id
        );
        setAnalysis({
          branch, places, loading: false,
          fromCache: data.fromCache, cachedAt: data.cachedAt,
          nearbyBranchDistances: data.nearbyBranchDistances,
        });
      }
    } catch {
      setAnalysis({ branch, places: [], error: "Gagal terhubung ke server", loading: false });
    }
  }, [apiKey, radius]);

  return (
    <div className="flex h-full min-h-screen">
      {/* Sidebar */}
      <div className="w-80 shrink-0 flex flex-col border-r border-border-soft bg-surface overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border-soft">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-4 h-4 text-ink-muted" strokeWidth={1.75} />
            <span className="text-sm font-semibold text-ink">Geo Analysis</span>
            <span className="ml-auto text-[11px] text-ink-muted bg-surface-muted px-2 py-0.5 rounded-full">{FTL_BRANCHES.length} cabang</span>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
            <input
              type="text"
              placeholder="Cari cabang atau kota..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs bg-surface-muted border border-border-soft rounded-lg focus:outline-none focus:border-accent text-ink placeholder:text-ink-muted"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X className="w-3 h-3 text-ink-muted" />
              </button>
            )}
          </div>

          {/* Region filter */}
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setRegionFilter("all")}
              className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${regionFilter === "all" ? "bg-accent text-accent-ink border-accent" : "border-border-soft text-ink-muted hover:text-ink"}`}
            >
              Semua
            </button>
            {regions.map(r => (
              <button
                key={r}
                onClick={() => setRegionFilter(r)}
                className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${regionFilter === r ? "bg-accent text-accent-ink border-accent" : "border-border-soft text-ink-muted hover:text-ink"}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* Radius selector */}
        <div className="px-5 py-3 border-b border-border-soft bg-surface-muted/50">
          <div className="text-[10px] text-ink-muted uppercase tracking-wider mb-2">Radius Analisa</div>
          <div className="flex gap-1.5">
            {RADIUS_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => setRadius(r)}
                className={`flex-1 text-[10px] py-1 rounded border transition-colors ${radius === r ? "bg-accent text-accent-ink border-accent" : "border-border-soft text-ink-muted hover:text-ink bg-surface"}`}
              >
                {r >= 1000 ? `${r / 1000}km` : `${r}m`}
              </button>
            ))}
          </div>
          {overlaps.length > 0 && (
            <div className="mt-2 text-[10px] text-negative">
              ⚠ {overlaps.length} pasang cabang overlap dalam radius ini
            </div>
          )}
        </div>

        {/* Branch list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-ink-muted">Tidak ada cabang ditemukan</div>
          ) : (
            <div className="p-2">
              {filtered.map((branch) => {
                const isSelected = selectedBranch?.code === branch.code;
                const isOverlapping = overlaps.some(o => o.a.code === branch.code || o.b.code === branch.code);
                return (
                  <button
                    key={branch.code}
                    onClick={() => fetchNearbyPlaces(branch)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-colors group ${isSelected ? "bg-accent text-accent-ink" : "hover:bg-surface-muted"}`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: REGION_COLORS[branch.region] || "#888" }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-medium truncate ${isSelected ? "text-accent-ink" : "text-ink"}`}>
                          {branch.name.replace("FTL GYM ", "").replace("FTL ", "")}
                        </div>
                        <div className={`text-[10px] truncate ${isSelected ? "text-accent-ink/70" : "text-ink-muted"}`}>
                          {branch.city}
                        </div>
                      </div>
                      {isOverlapping && !isSelected && (
                        <span className="text-[9px] text-negative border border-negative/30 rounded px-1 shrink-0">overlap</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* API Key input */}
        <div className="px-5 py-3 border-t border-border-soft">
          <button
            onClick={() => setShowApiInput(!showApiInput)}
            className="flex items-center gap-1.5 text-[10px] text-ink-muted hover:text-ink"
          >
            <Layers className="w-3 h-3" />
            Google Places API Key
            <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showApiInput ? "rotate-180" : ""}`} />
          </button>
          {showApiInput && (
            <div className="mt-2">
              <input
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-surface-muted border border-border-soft rounded focus:outline-none focus:border-accent text-ink font-mono"
              />
              <p className="text-[10px] text-ink-muted mt-1">Digunakan untuk fetch POI real sekitar cabang</p>
            </div>
          )}
          <button
            onClick={() => clearCache()}
            disabled={clearingCache}
            className="mt-2 w-full text-[10px] py-1 rounded border border-border-soft text-ink-muted hover:text-negative hover:border-negative transition-colors disabled:opacity-50"
          >
            {clearingCache ? "Menghapus..." : "Hapus Semua Cache"}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selectedBranch ? (
          /* Map-like overview */
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-6">
              <h1 className="text-xl font-semibold text-ink">Geographic Analysis</h1>
              <p className="text-sm text-ink-muted mt-1">Pilih cabang dari sidebar untuk analisa lokasi lengkap</p>
            </div>

            {/* Region summary cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
              {regions.map(region => {
                const branches = FTL_BRANCHES.filter(b => b.region === region);
                const regionOverlaps = overlaps.filter(o => o.a.region === region && o.b.region === region);
                return (
                  <button
                    key={region}
                    onClick={() => setRegionFilter(region === regionFilter ? "all" : region)}
                    className={`panel px-4 py-3 text-left transition-all hover:border-accent ${regionFilter === region ? "border-accent" : ""}`}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: REGION_COLORS[region] }} />
                      <span className="text-[10px] text-ink-muted uppercase tracking-wider">{region}</span>
                    </div>
                    <div className="text-2xl font-semibold text-ink">{branches.length}</div>
                    <div className="text-[11px] text-ink-muted mt-0.5">cabang</div>
                    {regionOverlaps.length > 0 && (
                      <div className="text-[10px] text-negative mt-1">{regionOverlaps.length} overlap</div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Overlap warning table */}
            {overlaps.length > 0 && (
              <div className="panel p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-4 h-4 text-negative" />
                  <h2 className="text-sm font-semibold text-ink">Cabang dengan Catchment Overlap ({overlaps.length} pasang)</h2>
                  <span className="text-[10px] text-ink-muted">dalam radius {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}</span>
                </div>
                <div className="space-y-2">
                  {overlaps.slice(0, 10).map((o, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border-soft last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-ink">
                          <span className="font-medium truncate">{o.a.name.replace("FTL GYM ", "")}</span>
                          <span className="text-ink-muted shrink-0">↔</span>
                          <span className="font-medium truncate">{o.b.name.replace("FTL GYM ", "")}</span>
                        </div>
                        <div className="text-[10px] text-ink-muted mt-0.5">{o.a.city} · {o.b.city}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-semibold text-negative">{(o.dist * 1000).toFixed(0)}m</div>
                        <div className="text-[10px] text-ink-muted">jarak</div>
                      </div>
                    </div>
                  ))}
                  {overlaps.length > 10 && (
                    <div className="text-xs text-ink-muted pt-1">+ {overlaps.length - 10} pasang lainnya</div>
                  )}
                </div>
              </div>
            )}

            {/* Branch grid */}
            <div>
              <h2 className="text-sm font-semibold text-ink mb-3">
                {regionFilter === "all" ? "Semua Cabang" : regionFilter} · {filtered.length} lokasi
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {filtered.map(b => (
                  <button
                    key={b.code}
                    onClick={() => fetchNearbyPlaces(b)}
                    className="panel px-4 py-3 text-left hover:border-accent transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: REGION_COLORS[b.region] }} />
                          <span className="text-[10px] text-ink-muted">{b.city}</span>
                        </div>
                        <div className="text-xs font-medium text-ink truncate">{b.name.replace("FTL GYM ", "").replace("FTL ", "")}</div>
                      </div>
                      <span className="text-[9px] font-mono text-ink-muted border border-border-soft rounded px-1.5 py-0.5 shrink-0">{b.code}</span>
                    </div>
                    <div className="text-[10px] text-ink-muted mt-1.5 truncate">{b.address.split(",")[0]}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Branch detail analysis */
          <div className="flex-1 overflow-auto">
            {/* Branch header */}
            <div className="px-6 py-4 border-b border-border-soft flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: REGION_COLORS[selectedBranch.region] }} />
                  <span className="text-xs text-ink-muted">{selectedBranch.region} · {selectedBranch.city}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <h1 className="text-lg font-semibold text-ink">{selectedBranch.name}</h1>
                  {analysis?.fromCache && analysis.cachedAt && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-muted border border-border-soft text-ink-muted">
                      Cache · {new Date(analysis.cachedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                  )}
                  {analysis?.fromCache && (
                    <button
                      onClick={async () => {
                        await clearCache(selectedBranch.code);
                        fetchNearbyPlaces(selectedBranch);
                      }}
                      disabled={clearingCache}
                      className="text-[10px] px-2 py-0.5 rounded border border-border-soft text-ink-muted hover:text-negative hover:border-negative transition-colors disabled:opacity-50"
                    >
                      {clearingCache ? "..." : "Hapus Cache"}
                    </button>
                  )}
                </div>
                <p className="text-xs text-ink-muted mt-0.5">{selectedBranch.address}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${selectedBranch.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-3 py-1.5 rounded-lg border border-border-soft text-ink-muted hover:text-ink hover:border-accent transition-colors"
                >
                  Buka di Maps
                </a>
                <button
                  onClick={() => { setSelectedBranch(null); setAnalysis(null); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border-soft text-ink-muted hover:text-ink transition-colors"
                >
                  ← Kembali
                </button>
              </div>
            </div>

            <div className="p-6">
              {analysis?.loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex gap-2 mb-3">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-2 h-2 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                  <p className="text-sm text-ink-muted">Memuat Places sekitar {selectedBranch.name}...</p>
                  <p className="text-[11px] text-ink-muted mt-1 opacity-60">Mengambil hingga 60 tempat, mohon tunggu</p>
                </div>
              ) : !apiKey ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Building2 className="w-8 h-8 text-ink-muted mb-3" strokeWidth={1.5} />
                  <p className="text-sm font-medium text-ink mb-1">Masukkan Google Places API Key</p>
                  <p className="text-xs text-ink-muted mb-4">untuk melihat tempat nyata di sekitar cabang ini</p>
                  <button
                    onClick={() => setShowApiInput(true)}
                    className="text-xs px-4 py-2 rounded-lg border border-accent text-accent hover:bg-accent hover:text-accent-ink transition-colors"
                  >
                    Masukkan API Key
                  </button>
                </div>
              ) : analysis?.error ? (
                <div className="text-center py-12 text-sm text-negative">{analysis.error}</div>
              ) : analysis?.places != null ? (
                (() => {
                  const categorized = categorizePlaces(analysis.places);
                  const nearbyBranchDistances = analysis.nearbyBranchDistances ?? {};
                  const hasRoadDistances = Object.values(nearbyBranchDistances).some(v => v != null);
                  const nearby = FTL_BRANCHES
                    .filter(b => b.code !== selectedBranch.code)
                    .map(b => ({ ...b, dist: haversineKm(selectedBranch.lat, selectedBranch.lng, b.lat, b.lng) }))
                    .filter(b => {
                      const roadM = nearbyBranchDistances[b.code];
                      // If road distance available, use that for the 5km cutoff
                      if (roadM != null) return roadM <= 5000;
                      return b.dist < 5;
                    })
                    .sort((a, b) => {
                      const ra = nearbyBranchDistances[a.code] ?? Infinity;
                      const rb = nearbyBranchDistances[b.code] ?? Infinity;
                      if (ra !== Infinity || rb !== Infinity) return ra - rb;
                      return a.dist - b.dist;
                    })
                    .slice(0, 5);

                  return (
                    <div className="space-y-4">
                      {/* Summary chips */}
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[11px] px-3 py-1 rounded-full bg-surface-muted border border-border-soft text-ink-muted">
                          {analysis.places.length} tempat dalam radius {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                        </span>
                        {POI_CATEGORIES.slice(0, -1).map(cat => {
                          const count = categorized[cat.key]?.length ?? 0;
                          if (count === 0) return null;
                          return (
                            <span
                              key={cat.key}
                              className="text-[11px] px-3 py-1 rounded-full border"
                              style={{ borderColor: cat.color + "55", color: cat.color }}
                            >
                              {cat.label} · {count}
                            </span>
                          );
                        })}
                      </div>

                      {/* Places by category — priority first, FTL inserted after residential */}
                      {(() => {
                        const PRIORITY_KEYS = ["competitor", "gym", "residential"];
                        const priorityCats = POI_CATEGORIES.filter(c => PRIORITY_KEYS.includes(c.key));
                        const restCats = POI_CATEGORIES.filter(c => !PRIORITY_KEYS.includes(c.key));

                        const renderCategory = (cat: typeof POI_CATEGORIES[0]) => {
                          const raw = categorized[cat.key];
                          if (!raw || raw.length === 0) return null;
                          const places = [...raw].sort((a, b) => {
                            const da = a.distance_road_m ?? haversineKm(selectedBranch.lat, selectedBranch.lng, a.geometry.location.lat, a.geometry.location.lng) * 1000;
                            const db = b.distance_road_m ?? haversineKm(selectedBranch.lat, selectedBranch.lng, b.geometry.location.lat, b.geometry.location.lng) * 1000;
                            return da - db;
                          });
                          return (
                            <div key={cat.key} className="panel px-5 py-4">
                              <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.color }} />
                                <h3 className="text-sm font-semibold text-ink">{cat.label}</h3>
                                {cat.badge && (
                                  <span
                                    className="text-[9px] px-1.5 py-0.5 rounded border font-medium"
                                    style={{ color: cat.color, borderColor: cat.color + "55" }}
                                  >
                                    {cat.badge}
                                  </span>
                                )}
                                <span className="text-[10px] text-ink-muted ml-auto">{places.length} tempat</span>
                              </div>
                              <div className="space-y-0">
                                {places.map((place, i) => {
                                  const roadM = place.distance_road_m;
                                  const distLabel = roadM != null
                                    ? roadM < 1000 ? `${roadM}m` : `${(roadM / 1000).toFixed(1)}km`
                                    : (() => {
                                        const d = haversineKm(selectedBranch.lat, selectedBranch.lng, place.geometry.location.lat, place.geometry.location.lng);
                                        return d < 1 ? `${(d * 1000).toFixed(0)}m ↗` : `${d.toFixed(1)}km ↗`;
                                      })();
                                  return (
                                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border-soft last:border-0">
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-ink truncate">{place.name}</div>
                                        <div className="text-[10px] text-ink-muted truncate mt-0.5">{place.vicinity}</div>
                                      </div>
                                      <div className="flex items-center gap-3 shrink-0">
                                        {place.rating != null && (
                                          <div className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                            <span className="text-[11px] font-medium text-ink">{place.rating.toFixed(1)}</span>
                                            {place.user_ratings_total != null && (
                                              <span className="text-[10px] text-ink-muted">({place.user_ratings_total})</span>
                                            )}
                                          </div>
                                        )}
                                        <span className="text-[11px] font-semibold text-ink-muted text-right">{distLabel}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        };

                        return (
                          <div className="space-y-3">
                            {/* 1: Cabang FTL Terdekat */}
                            {nearby.length > 0 && (
                              <div className="panel px-5 py-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-2 h-2 rounded-full shrink-0 bg-accent" />
                                  <h3 className="text-sm font-semibold text-ink">Cabang FTL Terdekat</h3>
                                  <span className="text-[10px] text-ink-muted ml-auto">dalam 5km · {hasRoadDistances ? "jarak jalan" : "jarak lurus"}</span>
                                </div>
                                <div className="space-y-0">
                                  {nearby.map(b => {
                                    const roadM = nearbyBranchDistances[b.code];
                                    const distLabel = roadM != null
                                      ? roadM < 1000 ? `${roadM}m` : `${(roadM / 1000).toFixed(1)}km`
                                      : b.dist < 1 ? `${(b.dist * 1000).toFixed(0)}m ↗` : `${b.dist.toFixed(1)}km ↗`;
                                    const distKm = roadM != null ? roadM / 1000 : b.dist;
                                    return (
                                    <div key={b.code} className="flex items-center gap-3 py-2 border-b border-border-soft last:border-0">
                                      <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: REGION_COLORS[b.region] }} />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-xs font-medium text-ink">{b.name.replace("FTL GYM ", "").replace("FTL ", "")}</div>
                                        <div className="text-[10px] text-ink-muted">{b.city}</div>
                                      </div>
                                      <div className={`text-xs font-semibold shrink-0 ${distKm < 1 ? "text-negative" : distKm < 2 ? "text-neutral" : "text-positive"}`}>
                                        {distLabel}
                                      </div>
                                    </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 2+: Competitor, Gym, Residential, Sisanya */}
                            {priorityCats.map(renderCategory)}
                            {restCats.map(renderCategory)}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
