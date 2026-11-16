"use client";

import { useMemo, useState } from "react";
import {
  Search, Moon, Sun, Menu, X, Heart, Eye, BadgeCheck, Clock, DollarSign,
  ChevronLeft, ChevronRight, Grid, List, Bookmark, ArrowLeft, Check,
  ShieldCheck, TrendingUp, Users, Star, Sparkles, ArrowUpRight, Filter,
  Store, Cloud, Globe, Smartphone, Monitor, Puzzle, Layers, Rss, Home,
  ShoppingBag, Zap, Search as SearchIcon, MapPin, Lock, BarChart3
} from "lucide-react";

/* ---------- Types ---------- */
type ProjectType = "SaaS" | "Shop" | "Blog" | "Website" | "Mobile" | "Desktop" | "Browser" | "Domain" | "Other";
type PostType = "sell" | "sold" | "cofounder" | "showcase";

type Project = {
  id: number;
  name: string;
  pitch: string;
  description: string;
  type: ProjectType;
  postType: PostType;
  price: number | null; // null = Contact
  priceType: "Negotiable" | "Minimum" | "Set" | "Contact";
  revenueRange: "0-1000" | "1000-5000" | "5000-10000" | "10000+";
  revenueMonthly: number;
  profitMargin: number;
  visitors: string;
  hours: "Under 5" | "5-10" | "10-20" | "20-40";
  seller: string;
  verified: boolean;
  memberSince: string;
  date: string;
  likes: number;
  views: number;
  img: string;
  avatar: string;
  tech: string[];
  market: string;
  assets: { domain: boolean; code: boolean; socials: boolean; supplier: boolean; marketing: boolean; brand: boolean; docs: boolean };
  featured?: boolean;
};

/* ---------- Mock Data (42 projects, 14 sold) ---------- */
const SELLERS = ["Norbert","win-marketing","founders","JojoDuke","baydaameda","OODIENCE","mrasero","Filip","bagshaw50","Wisdom","Warner S","Themaker"];

const BASE: Project[] = [
  { id:1, name:"Ampzora.com", pitch:"Trending product sold with huge profit, with a USA supplier and marketing ready", description:"Shopify store that did $1,149 in 7 days from a $100 Instagram test. Includes US supplier, ad creatives, and the exact marketing plan that worked. Zero shop management needed — fulfillment is automated.", type:"Shop", postType:"sold", price:999, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:1149, profitMargin:76, visitors:"1k-5k", hours:"Under 5", seller:"Norbert", verified:true, memberSince:"2023", date:"2026-05-25", likes:42, views:3120, img:"https://picsum.photos/seed/ampzora/400/300", avatar:"https://i.pravatar.cc/80?img=12", tech:["Shopify","Meta Ads","Canva"], market:"E-commerce", assets:{domain:true,code:false,socials:true,supplier:true,marketing:true,brand:true,docs:true}, featured:true },
  { id:2, name:"RedMasc.com", pitch:"Trending mascot product — huge profit, USA supplier, marketing included", description:"Clone campaign of Ampzora in the health niche. $1,140 revenue, $640 profit from $100 spend. Full creative pack, supplier sheet, and agency contact included.", type:"Shop", postType:"sold", price:999, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:1140, profitMargin:56, visitors:"1k-5k", hours:"Under 5", seller:"Norbert", verified:true, memberSince:"2023", date:"2026-05-23", likes:38, views:2980, img:"https://picsum.photos/seed/redmasc/400/300", avatar:"https://i.pravatar.cc/80?img=12", tech:["Shopify","TikTok Shop"], market:"E-commerce", assets:{domain:true,code:false,socials:true,supplier:true,marketing:true,brand:true,docs:true} },
  { id:3, name:"AI Headshots Generator", pitch:"10K monthly visits · $2–2.5k MRR · 70–80% profit margin", description:"AI headshot tool with Stripe subscriptions. SEO + Product Hunt traffic, no ads needed. All prompts, models, and Stripe dashboard transferred. Profit margin >70% after API costs.", type:"Website", postType:"sold", price:22000, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:2250, profitMargin:75, visitors:"10k", hours:"Under 5", seller:"mrasero", verified:false, memberSince:"2022", date:"2023-11-06", likes:58, views:8740, img:"https://picsum.photos/seed/headshot/400/300", avatar:"https://i.pravatar.cc/80?img=33", tech:["Next.js","OpenAI","Stripe","Vercel"], market:"AI / SaaS", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true}, featured:true },
  { id:4, name:"Paws & Prints", pitch:"Personalised pet art — $24k revenue, active print-on-demand store", description:"E-commerce store selling custom pet portraits. $24k lifetime sales, 5.0★ reviews. Print supplier + email flows included. Buyer can run it weekends only.", type:"Shop", postType:"sell", price:5000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:1800, profitMargin:62, visitors:"5k-10k", hours:"5-10", seller:"founders", verified:false, memberSince:"2021", date:"2024-01-21", likes:61, views:7210, img:"https://picsum.photos/seed/paws/400/300", avatar:"https://i.pravatar.cc/80?img=5", tech:["Shopify","Printful","Klaviyo"], market:"Pets", assets:{domain:true,code:false,socials:true,supplier:true,marketing:true,brand:true,docs:false}, featured:true },
  { id:5, name:"Game Assessment Prep", pitch:"The only platform to master all 11 HireVue games", description:"SaaS for job candidates to practice game-based hiring tests. Stripe subscriptions, organic search traffic, realistic simulations. Runs on Next.js + Postgres.", type:"SaaS", postType:"sell", price:65000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:4100, profitMargin:84, visitors:"5k-10k", hours:"Under 5", seller:"JojoDuke", verified:false, memberSince:"2020", date:"2026-02-07", likes:47, views:6540, img:"https://picsum.photos/seed/gameprep/400/300", avatar:"https://i.pravatar.cc/80?img=8", tech:["Next.js","Supabase","Stripe"], market:"Career", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:6, name:"Dinner Made Simple", pitch:"AI-powered recipe & meal planning SaaS — live and ready to scale", description:"AI meal planner with grocery lists and family profiles. Pre-launch with 200 waitlist emails. Code clean, deploy on Vercel in 10 mins.", type:"SaaS", postType:"sell", price:6500, priceType:"Set", revenueRange:"1000-5000", revenueMonthly:1200, profitMargin:90, visitors:"500", hours:"5-10", seller:"win-marketing", verified:false, memberSince:"2024", date:"2026-10-12", likes:29, views:2100, img:"https://picsum.photos/seed/dinner/400/300", avatar:"https://i.pravatar.cc/80?img=15", tech:["React","OpenAI","Node"], market:"Food", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:7, name:"SmartPawz Pet Insurance", pitch:"2-year-old site for pet owners — passive PPC income, $1.5k/mo", description:"Insurance affiliate site with PPC revenue. 8.2k pageviews/mo, runs itself. All creatives, tracking, and agency contacts included.", type:"Website", postType:"sell", price:39990, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:1500, profitMargin:88, visitors:"8.2k", hours:"Under 5", seller:"win-marketing", verified:false, memberSince:"2019", date:"2023-09-24", likes:44, views:5120, img:"https://picsum.photos/seed/smartpawz/400/300", avatar:"https://i.pravatar.cc/80?img=15", tech:["WordPress","SEO"], market:"Insurance", assets:{domain:true,code:false,socials:false,supplier:false,marketing:true,brand:true,docs:true} },
  { id:8, name:"Boxing & Combat Sports Blog", pitch:"News site with press-pass invites — AdSense + affiliate", description:"Boxing news blog with established authority. Receives media invites, 40k/mo visits. 3-year-old domain, zero technical work.", type:"Blog", postType:"sell", price:65000, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:3200, profitMargin:92, visitors:"40k", hours:"5-10", seller:"OODIENCE", verified:false, memberSince:"2021", date:"2023-09-20", likes:39, views:19800, img:"https://picsum.photos/seed/boxing/400/300", avatar:"https://i.pravatar.cc/80?img=22", tech:["WordPress","AdSense"], market:"Sports Media", assets:{domain:true,code:false,socials:true,supplier:false,marketing:false,brand:true,docs:false} },
  { id:9, name:"NativeLaunch — Expo Template", pitch:"Modern Expo starter with auth, payments & analytics built-in", description:"React Native template: Supabase auth, RevenueCat payments, OneSignal push, Sentry. Save 12 weeks of boilerplate. Used in 400+ apps.", type:"SaaS", postType:"sell", price:25000, priceType:"Set", revenueRange:"1000-5000", revenueMonthly:2600, profitMargin:95, visitors:"3k", hours:"5-10", seller:"JojoDuke", verified:false, memberSince:"2020", date:"2025-10-25", likes:73, views:11200, img:"https://picsum.photos/seed/native/400/300", avatar:"https://i.pravatar.cc/80?img=8", tech:["React Native","Expo","Supabase"], market:"Dev Tools", assets:{domain:false,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true}, featured:true },
  { id:10, name:"Revitalica — Skincare", pitch:"E-commerce beauty store — Spanish market, local fulfillment", description:"Skincare shop, 6 months old, $3.5k/mo. Dropship or local fulfillment — both suppliers included. Instagram 50k followers included.", type:"Shop", postType:"sell", price:3500, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:3500, profitMargin:58, visitors:"6k", hours:"Under 5", seller:"founders", verified:false, memberSince:"2021", date:"2024-07-21", likes:35, views:4300, img:"https://picsum.photos/seed/skincare/400/300", avatar:"https://i.pravatar.cc/80?img=5", tech:["Shopify","Klaviyo"], market:"Beauty", assets:{domain:true,code:false,socials:true,supplier:true,marketing:true,brand:true,docs:false} },
  { id:11, name:"Fiverr Level Two — $350k Earnings", pitch:"850+ reviews (5.0★) — explainer & animation niche", description:"Fiverr Level 2 account with course content and client list. Transferable via Fiverr official process. Near Top Rated.", type:"Other", postType:"sell", price:15500, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:1800, profitMargin:85, visitors:"n/a", hours:"10-20", seller:"Wisdom", verified:false, memberSince:"2022", date:"2023-10-24", likes:52, views:8900, img:"https://picsum.photos/seed/fiverr/400/300", avatar:"https://i.pravatar.cc/80?img=41", tech:["After Effects","Fiverr"], market:"Services", assets:{domain:false,code:false,socials:true,supplier:false,marketing:false,brand:true,docs:true} },
  { id:12, name:"Templates For Notion", pitch:"Notion templates + newsletter for startups and freelancers", description:"26 templates, 14 paid, newsletter with 4k subs. $60k ask — negotiation open. All Gumroad + Notion duplicate links included.", type:"Other", postType:"sell", price:60000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:2900, profitMargin:97, visitors:"2k", hours:"5-10", seller:"JojoDuke", verified:false, memberSince:"2020", date:"2025-10-05", likes:66, views:9800, img:"https://picsum.photos/seed/notion/400/300", avatar:"https://i.pravatar.cc/80?img=8", tech:["Notion","Gumroad"], market:"Productivity", assets:{domain:true,code:false,socials:true,supplier:false,marketing:true,brand:true,docs:false} },
  { id:13, name:"Automated Database Portfolio: 7x Websites", pitch:"$10K YTD revenue · >$3/mo burn rate · 95% margin", description:"7 SEO websites + 1 digital product. One dashboard. Search consoles and AdSense combined. No maintenance — automated content pipeline.", type:"Website", postType:"sell", price:9800, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:1100, profitMargin:95, visitors:"25k", hours:"Under 5", seller:"founders", verified:false, memberSince:"2021", date:"2024-09-27", likes:48, views:7600, img:"https://picsum.photos/seed/database/400/300", avatar:"https://i.pravatar.cc/80?img=5", tech:["Python","SEO","AdSense"], market:"Content", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:14, name:"Nikey Stock", pitch:"Passive dropshipping Nike shoes — automated WooCommerce", description:"Automated dropship store, USA shipping 3 days. $150 ask reduction if sold today. Supplier API included.", type:"Shop", postType:"sell", price:160, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:1300, profitMargin:49, visitors:"1k", hours:"Under 5", seller:"bagshaw50", verified:false, memberSince:"2022", date:"2023-10-26", likes:19, views:1800, img:"https://picsum.photos/seed/nikey/400/300", avatar:"https://i.pravatar.cc/80?img=18", tech:["WooCommerce","AliExpress"], market:"Fashion", assets:{domain:true,code:false,socials:false,supplier:true,marketing:false,brand:true,docs:false} },
  { id:15, name:"Answer.AI — 650k Downloads", pitch:"Scan & get instant answers on your phone — Google Play", description:"Android app + backend, 650k downloads, 4.2★. Scan homework, docs, whiteboards. Full source + Play Console transfer.", type:"Mobile", postType:"sell", price:35000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:2800, profitMargin:81, visitors:"650k downloads", hours:"10-20", seller:"Warner S", verified:false, memberSince:"2021", date:"2023-10-06", likes:71, views:22300, img:"https://picsum.photos/seed/answerai/400/300", avatar:"https://i.pravatar.cc/80?img=60", tech:["Flutter","Firebase","OpenAI"], market:"Education", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:16, name:"World Presets", pitch:"Automated digital products — profitable e-commerce, hands-off", description:"Selling Lightroom presets, 40k customers. Stripe + Paddle, all fulfillment automated via webhook.", type:"Shop", postType:"sell", price:9000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:2100, profitMargin:94, visitors:"12k", hours:"Under 5", seller:"Filip", verified:false, memberSince:"2022", date:"2024-07-07", likes:33, views:3900, img:"https://picsum.photos/seed/presets/400/300", avatar:"https://i.pravatar.cc/80?img=25", tech:["Shopify","Stripe"], market:"Digital Products", assets:{domain:true,code:false,socials:true,supplier:false,marketing:true,brand:true,docs:false} },
  { id:17, name:"RecapioGPT", pitch:"Quillbot alternative — summarize anything in 1 click", description:"AI summarizer for web/files. Own model + OpenAI fallback. 60k ask, fast growth 2023-2024.", type:"SaaS", postType:"sell", price:60000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:3400, profitMargin:79, visitors:"8k", hours:"Under 5", seller:"Themaker", verified:false, memberSince:"2020", date:"2023-08-09", likes:55, views:8100, img:"https://picsum.photos/seed/recapio/400/300", avatar:"https://i.pravatar.cc/80?img=14", tech:["Next.js","OpenAI","Supabase"], market:"AI / SaaS", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:18, name:"Riding The Globe", pitch:"Absentee owner — digital products e-commerce, $2k/mo", description:"Digital product store, owner absentee. All products, email flows, and 20k customer list included.", type:"Shop", postType:"sell", price:15000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:2000, profitMargin:91, visitors:"4k", hours:"Under 5", seller:"Filip", verified:false, memberSince:"2022", date:"2024-03-26", likes:27, views:2600, img:"https://picsum.photos/seed/globe/400/300", avatar:"https://i.pravatar.cc/80?img=25", tech:["Shopify","Gumroad"], market:"Digital Products", assets:{domain:true,code:false,socials:true,supplier:false,marketing:true,brand:true,docs:false} },
  { id:19, name:"Kinderic Toys", pitch:"Ready-to-run Shopify toy store, active socials media", description:"Kids toys store, supplier + 30k Instagram followers. Fulfills from EU warehouse in 5-7 days.", type:"Shop", postType:"sell", price:3600, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:1600, profitMargin:54, visitors:"3k", hours:"Under 5", seller:"baydaameda", verified:false, memberSince:"2021", date:"2025-03-06", likes:22, views:1900, img:"https://picsum.photos/seed/toys/400/300", avatar:"https://i.pravatar.cc/80?img=47", tech:["Shopify"], market:"Kids", assets:{domain:true,code:false,socials:true,supplier:true,marketing:false,brand:true,docs:false} },
  { id:20, name:"VirallyMedia", pitch:"Established marketing agency with thriving asset portfolio", description:"6 years in business, 200k social following, $50k+ revenue. Domain virallymedia.org, all brand assets included.", type:"Website", postType:"sell", price:25000, priceType:"Contact", revenueRange:"5000-10000", revenueMonthly:5200, profitMargin:68, visitors:"15k", hours:"20-40", seller:"win-marketing", verified:false, memberSince:"2019", date:"2024-11-14", likes:31, views:4700, img:"https://picsum.photos/seed/viral/400/300", avatar:"https://i.pravatar.cc/80?img=15", tech:["WordPress","Agency"], market:"Agency", assets:{domain:true,code:false,socials:true,supplier:false,marketing:true,brand:true,docs:true} },
  { id:21, name:"Web3 Loop AI", pitch:"Chatbot + AI + Gaming in one Telegram Mini App", description:"Web3 AI ecosystem, Telegram Mini App + backend. Chatbot, quests, gaming. Investors welcome, code complete.", type:"Website", postType:"sell", price:1000, priceType:"Negotiable", revenueRange:"0-1000", revenueMonthly:800, profitMargin:72, visitors:"1k", hours:"5-10", seller:"JojoDuke", verified:false, memberSince:"2020", date:"2025-02-02", likes:17, views:1400, img:"https://picsum.photos/seed/loop/400/300", avatar:"https://i.pravatar.cc/80?img=8", tech:["React","Telegram API","Solidity"], market:"Web3", assets:{domain:true,code:true,socials:true,supplier:false,marketing:false,brand:true,docs:false} },
  { id:22, name:"Astrae Design", pitch:"React SaaS landing pages + templates marketplace", description:"React + Next.js + Tailwind templates, 2k customers. Framer Motion animations. Lifetime updates included.", type:"SaaS", postType:"sell", price:2000, priceType:"Negotiable", revenueRange:"0-1000", revenueMonthly:900, profitMargin:93, visitors:"1.5k", hours:"5-10", seller:"JojoDuke", verified:false, memberSince:"2020", date:"2025-01-10", likes:24, views:2200, img:"https://picsum.photos/seed/astrae/400/300", avatar:"https://i.pravatar.cc/80?img=8", tech:["Next.js","Tailwind","Framer"], market:"Design", assets:{domain:false,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:23, name:"Midas — Mobile Money Shopping", pitch:"Online shopping for Africa via mobile money", description:"Aggregates 400+ stores, pay with mobile money. Built for Kenya/Nigeria. Code + Play Store listing.", type:"Browser", postType:"sell", price:1200, priceType:"Negotiable", revenueRange:"0-1000", revenueMonthly:600, profitMargin:65, visitors:"800", hours:"Under 5", seller:"JojoDuke", verified:false, memberSince:"2020", date:"2024-12-10", likes:12, views:900, img:"https://picsum.photos/seed/midas/400/300", avatar:"https://i.pravatar.cc/80?img=8", tech:["React","M-Pesa API"], market:"Fintech", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:false} },
  { id:24, name:"Studio IX — Web Dev Agency", pitch:"Premium web dev & design agency for startups", description:"Retainer clients, $15k/mo pipeline. Brand, processes, and 3 case studies included. Remote team.", type:"Website", postType:"sell", price:15000, priceType:"Negotiable", revenueRange:"5000-10000", revenueMonthly:6800, profitMargin:71, visitors:"2k", hours:"20-40", seller:"JojoDuke", verified:false, memberSince:"2020", date:"2024-04-09", likes:28, views:3100, img:"https://picsum.photos/seed/studioix/400/300", avatar:"https://i.pravatar.cc/80?img=8", tech:["Agency","Webflow"], market:"Agency", assets:{domain:true,code:false,socials:true,supplier:false,marketing:true,brand:true,docs:true} },
  { id:25, name:"White Label SaaS", pitch:"Ready-made website businesses — white label", description:"White-label SaaS platform, multi-tenant. Sell to your own clients, keep 100% margin.", type:"SaaS", postType:"sell", price:5950, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:1400, profitMargin:83, visitors:"1k", hours:"5-10", seller:"founders", verified:false, memberSince:"2021", date:"2023-11-19", likes:20, views:1700, img:"https://picsum.photos/seed/whitelabel/400/300", avatar:"https://i.pravatar.cc/80?img=5", tech:["Next.js","Postgres"], market:"SaaS", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:26, name:"ErgoRest", pitch:"Comfortable sleep products — website with real sales", description:"Sleep products store, $1.8k/mo, organic Pinterest traffic. Supplier in EU, 3-day shipping.", type:"Shop", postType:"sell", price:5000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:1800, profitMargin:61, visitors:"4k", hours:"5-10", seller:"baydaameda", verified:false, memberSince:"2021", date:"2023-10-25", likes:26, views:2400, img:"https://picsum.photos/seed/ergorest/400/300", avatar:"https://i.pravatar.cc/80?img=47", tech:["Shopify"], market:"Health", assets:{domain:true,code:false,socials:true,supplier:true,marketing:true,brand:true,docs:false} },
  { id:27, name:"Electronics Affiliate — Amazon", pitch:"Amazon affiliate site, high commissions per sale", description:"Electronics reviews site, Amazon Associates, $1.2k/mo. SEO content done for 12 months.", type:"Website", postType:"sell", price:160, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:1200, profitMargin:100, visitors:"9k", hours:"Under 5", seller:"bagshaw50", verified:false, memberSince:"2022", date:"2023-10-15", likes:15, views:1300, img:"https://picsum.photos/seed/affiliate/400/300", avatar:"https://i.pravatar.cc/80?img=18", tech:["WordPress","SEO"], market:"Affiliate", assets:{domain:true,code:false,socials:false,supplier:false,marketing:false,brand:true,docs:false} },
  { id:28, name:"Trading Courses Platform", pitch:"Build your own online school — courses included", description:"Video course platform with 3 trading courses. Stripe billing, member area, certificates.", type:"Other", postType:"sell", price:700, priceType:"Minimum", revenueRange:"0-1000", revenueMonthly:700, profitMargin:89, visitors:"600", hours:"5-10", seller:"Wisdom", verified:false, memberSince:"2022", date:"2023-10-08", likes:11, views:800, img:"https://picsum.photos/seed/trading/400/300", avatar:"https://i.pravatar.cc/80?img=41", tech:["Kajabi","Stripe"], market:"Education", assets:{domain:true,code:false,socials:true,supplier:false,marketing:false,brand:true,docs:false} },
  { id:29, name:"Poadio — Podcast Monetization", pitch:"Upload, monetize and sell your podcasts in one place", description:"Podcast platform with monetization + marketplace. 500 creators, Stripe Connect.", type:"SaaS", postType:"sell", price:2400, priceType:"Set", revenueRange:"1000-5000", revenueMonthly:1100, profitMargin:77, visitors:"2k", hours:"20-40", seller:"Themaker", verified:false, memberSince:"2020", date:"2023-08-11", likes:18, views:1600, img:"https://picsum.photos/seed/poadio/400/300", avatar:"https://i.pravatar.cc/80?img=14", tech:["Rails","Stripe"], market:"Media", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:30, name:"Buni AI", pitch:"VoiceOver, Audio-to-Text, Text AI, Image AI, Chat AI", description:"Multi-AI tool suite, 1k active users. OpenAI + Stable Diffusion. Modern UI, dark mode.", type:"SaaS", postType:"sell", price:4800, priceType:"Set", revenueRange:"1000-5000", revenueMonthly:1500, profitMargin:74, visitors:"3k", hours:"20-40", seller:"Themaker", verified:false, memberSince:"2020", date:"2023-06-27", likes:36, views:4100, img:"https://picsum.photos/seed/buni/400/300", avatar:"https://i.pravatar.cc/80?img=14", tech:["React","OpenAI"], market:"AI / SaaS", assets:{domain:true,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:31, name:"Askmehost", pitch:"Lightning fast web hosting — reseller business", description:"Web hosting reseller, 200 customers, $2.5k MRR. Control panel + billing included.", type:"SaaS", postType:"sell", price:25000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:2500, profitMargin:52, visitors:"n/a", hours:"Under 5", seller:"founders", verified:false, memberSince:"2021", date:"2022-02-02", likes:21, views:2000, img:"https://picsum.photos/seed/host/400/300", avatar:"https://i.pravatar.cc/80?img=5", tech:["WHMCS","cPanel"], market:"Hosting", assets:{domain:true,code:false,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:32, name:"Lovepawz Pet Empire", pitch:"Pet product business empire — dog + cat niches", description:"Pet products, $2.2k/mo, 15k Instagram. Supplier + ad accounts included.", type:"Shop", postType:"sell", price:7000, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:2200, profitMargin:57, visitors:"7k", hours:"5-10", seller:"baydaameda", verified:false, memberSince:"2021", date:"2022-04-30", likes:30, views:2800, img:"https://picsum.photos/seed/lovepawz/400/300", avatar:"https://i.pravatar.cc/80?img=47", tech:["Shopify"], market:"Pets", assets:{domain:true,code:false,socials:true,supplier:true,marketing:true,brand:true,docs:false} },
  { id:33, name:"Resume Writing Marketplace", pitch:"2.08M backlinks · Highly profitable · No coding required", description:"Resume writing marketplace, 2.08M backlinks, fully outsourced. Anyone can run it. Permanent supplier included.", type:"Website", postType:"cofounder", price:null, priceType:"Contact", revenueRange:"1000-5000", revenueMonthly:1900, profitMargin:88, visitors:"22k", hours:"5-10", seller:"founders", verified:false, memberSince:"2021", date:"2024-05-23", likes:44, views:6700, img:"https://picsum.photos/seed/resume/400/300", avatar:"https://i.pravatar.cc/80?img=5", tech:["WordPress"], market:"Career", assets:{domain:true,code:false,socials:false,supplier:true,marketing:false,brand:true,docs:true} },
  { id:34, name:"Cycling Sunglasses Store", pitch:"Highly profitable dropship — USA 3-day shipping", description:"Cycling sunglasses, 63% margin, US supplier ships in 3 days. Ad creatives included.", type:"Shop", postType:"cofounder", price:9999, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:1700, profitMargin:63, visitors:"2k", hours:"Under 5", seller:"baydaameda", verified:false, memberSince:"2021", date:"2022-09-15", likes:16, views:1200, img:"https://picsum.photos/seed/cycling/400/300", avatar:"https://i.pravatar.cc/80?img=47", tech:["Shopify"], market:"Sports", assets:{domain:true,code:false,socials:true,supplier:true,marketing:true,brand:true,docs:false} },
  { id:35, name:"E-Bikes Reviews Blog", pitch:"Reviews site in e-bicycles niche — passive, part-time", description:"E-bike review blog, $2.8k/mo affiliate. Fully passive, writer included.", type:"Blog", postType:"showcase", price:65000, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:2800, profitMargin:90, visitors:"18k", hours:"5-10", seller:"OODIENCE", verified:false, memberSince:"2021", date:"2023-09-03", likes:32, views:5400, img:"https://picsum.photos/seed/ebike/400/300", avatar:"https://i.pravatar.cc/80?img=22", tech:["WordPress"], market:"Sports", assets:{domain:true,code:false,socials:true,supplier:false,marketing:false,brand:true,docs:false} },
  { id:36, name:"Atlas — AI Agency", pitch:"Monthly subscription design & web development agency", description:"AI-native agency, $14k/mo retainers. Miro + Linear + Notion brand system included.", type:"SaaS", postType:"sold", price:14000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:4200, profitMargin:66, visitors:"1k", hours:"10-20", seller:"JojoDuke", verified:false, memberSince:"2020", date:"2025-06-19", likes:49, views:7300, img:"https://picsum.photos/seed/atlas/400/300", avatar:"https://i.pravatar.cc/80?img=8", tech:["Framer","Notion"], market:"Agency", assets:{domain:true,code:false,socials:true,supplier:false,marketing:true,brand:true,docs:true} },
  { id:37, name:"Doilies Online", pitch:"Handmade doilies e-commerce — $1,200/mo, 25k uniques", description:"Handmade goods, $1.2k/mo, 25k uniques/mo. Etsy + Shopify. Supply chain in place.", type:"Shop", postType:"sold", price:7000, priceType:"Minimum", revenueRange:"1000-5000", revenueMonthly:1200, profitMargin:59, visitors:"25k", hours:"5-10", seller:"baydaameda", verified:false, memberSince:"2021", date:"2021-07-31", likes:23, views:3100, img:"https://picsum.photos/seed/doilies/400/300", avatar:"https://i.pravatar.cc/80?img=47", tech:["Shopify","Etsy"], market:"Handmade", assets:{domain:true,code:false,socials:true,supplier:true,marketing:false,brand:true,docs:false} },
  { id:38, name:"Store Pickup — Shopify Plugin", pitch:"Shopify plugin for in-store pickup — 400 stores", description:"Plugin with 400 active stores, $800/mo. App Store listing transfer included.", type:"SaaS", postType:"sold", price:5000, priceType:"Negotiable", revenueRange:"0-1000", revenueMonthly:800, profitMargin:86, visitors:"400 stores", hours:"Under 5", seller:"founders", verified:false, memberSince:"2021", date:"2017-12-28", likes:19, views:1500, img:"https://picsum.photos/seed/pickup/400/300", avatar:"https://i.pravatar.cc/80?img=5", tech:["Ruby","Shopify API"], market:"E-commerce", assets:{domain:false,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:39, name:"Sportsry News Media", pitch:"Sports news website with AdSense (India) account", description:"Sports news, $1.6k/mo AdSense. Team of writers, handover docs included.", type:"Blog", postType:"sold", price:21000, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:1600, profitMargin:84, visitors:"60k", hours:"20-40", seller:"OODIENCE", verified:false, memberSince:"2021", date:"2022-07-07", likes:27, views:8800, img:"https://picsum.photos/seed/sports/400/300", avatar:"https://i.pravatar.cc/80?img=22", tech:["WordPress"], market:"Sports Media", assets:{domain:true,code:false,socials:true,supplier:false,marketing:false,brand:true,docs:false} },
  { id:40, name:"Great Deal — Dropshipping Store", pitch:"Hard to sell but lack funding — profitable store", description:"Dropshipping store, $1.4k/mo, owner needs funding. All supplier + ad data included.", type:"Shop", postType:"sold", price:4500, priceType:"Negotiable", revenueRange:"1000-5000", revenueMonthly:1400, profitMargin:51, visitors:"2k", hours:"Under 5", seller:"baydaameda", verified:false, memberSince:"2021", date:"2020-07-24", likes:14, views:1100, img:"https://picsum.photos/seed/greatdeal/400/300", avatar:"https://i.pravatar.cc/80?img=47", tech:["Shopify"], market:"E-commerce", assets:{domain:true,code:false,socials:false,supplier:true,marketing:true,brand:true,docs:false} },
  { id:41, name:"Mobile Game — Brain Trainer", pitch:"iOS + Android brain training game, 100k downloads", description:"React Native game, 100k downloads, $900/mo IAP. Source + store accounts included.", type:"Mobile", postType:"sell", price:8000, priceType:"Negotiable", revenueRange:"0-1000", revenueMonthly:900, profitMargin:78, visitors:"100k dl", hours:"5-10", seller:"Warner S", verified:false, memberSince:"2021", date:"2025-08-01", likes:34, views:4600, img:"https://picsum.photos/seed/brain/400/300", avatar:"https://i.pravatar.cc/80?img=60", tech:["React Native","AdMob"], market:"Games", assets:{domain:false,code:true,socials:false,supplier:false,marketing:false,brand:true,docs:true} },
  { id:42, name:"Domain — petgizmo.com", pitch:"Short brandable domain, perfect for pet products", description:"Brandable domain, 12 years old, reg via GoDaddy. Instant transfer.", type:"Domain", postType:"sell", price:350, priceType:"Set", revenueRange:"0-1000", revenueMonthly:0, profitMargin:100, visitors:"n/a", hours:"Under 5", seller:"win-marketing", verified:false, memberSince:"2019", date:"2026-03-01", likes:5, views:300, img:"https://picsum.photos/seed/domain/400/300", avatar:"https://i.pravatar.cc/80?img=15", tech:["Domain"], market:"Domains", assets:{domain:true,code:false,socials:false,supplier:false,marketing:false,brand:false,docs:false} },
];

function formatPrice(p: Project) {
  if (!p.price) return "Contact";
  return `$${p.price.toLocaleString()}`;
}

function timeAgo(d: string) {
  const year = new Date(d).getFullYear();
  if (year >= 2026) return "2026";
  return d.slice(0, 10);
}

function TypeIcon({ t }: { t: ProjectType }) {
  const map: Record<ProjectType, any> = { SaaS: Cloud, Shop: ShoppingBag, Blog: Rss, Website: Globe, Mobile: Smartphone, Desktop: Monitor, Browser: Puzzle, Domain: Home, Other: Layers };
  const I = map[t];
  return <I className="h-3.5 w-3.5" />;
}

/* ---------- Main App ---------- */
export default function SideProjectorsPage() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState<{ kind: "home" | "detail" | "seller"; id?: number; seller?: string }>({ kind: "home" });
  const [query, setQuery] = useState("");
  const [postType, setPostType] = useState<"all" | PostType>("all");
  const [typeFilter, setTypeFilter] = useState<ProjectType | "All">("All");
  const [priceRange, setPriceRange] = useState("All");
  const [revenueRange, setRevenueRange] = useState("All");
  const [hoursFilter, setHoursFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [layout, setLayout] = useState<"list" | "grid">("list");
  const [page, setPage] = useState(1);
  const [liked, setLiked] = useState<Set<number>>(new Set([3, 9, 15]));
  const [saved, setSaved] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<Set<number>>(new Set([0]));
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2600);
  };

  const toggleLike = (id: number) => {
    setLiked(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };

  const toggleFaq = (i: number) => {
    setFaqOpen(prev => {
      const n = new Set(prev);
      if (n.has(i)) n.delete(i); else n.add(i);
      return n;
    });
  };

  const filtered = useMemo(() => {
    let list = [...BASE];
    if (postType !== "all") list = list.filter(p => p.postType === postType);
    if (typeFilter !== "All") list = list.filter(p => p.type === typeFilter);
    if (revenueRange !== "All") list = list.filter(p => p.revenueRange === revenueRange);
    if (hoursFilter !== "All") list = list.filter(p => p.hours === hoursFilter);
    if (priceRange !== "All") {
      list = list.filter(p => {
        if (!p.price) return false;
        if (priceRange === "Under $1000") return p.price < 1000;
        if (priceRange === "$1000-5000") return p.price >= 1000 && p.price <= 5000;
        if (priceRange === "$5000-10000") return p.price > 5000 && p.price <= 10000;
        if (priceRange === "$10000+") return p.price > 10000;
        return true;
      });
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(p => (p.name + " " + p.pitch + " " + p.market + " " + p.seller).toLowerCase().includes(q));
    }
    if (sortBy === "Newest") list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sortBy === "Price low-high") list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    if (sortBy === "Price high-low") list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    if (sortBy === "Revenue") list.sort((a, b) => b.revenueMonthly - a.revenueMonthly);
    return list;
  }, [query, postType, typeFilter, priceRange, revenueRange, hoursFilter, sortBy]);

  const PER_PAGE = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const detailProject = view.id ? BASE.find(p => p.id === view.id) : undefined;
  const sellerProjects = view.seller ? BASE.filter(p => p.seller === view.seller) : [];
  const sellerInfo = view.seller ? BASE.find(p => p.seller === view.seller) : undefined;

  const bg = dark ? "bg-[#07080C] text-white" : "bg-[#F7F8FA] text-gray-900";
  const card = dark ? "bg-[#121622] border-white/10" : "bg-white border-gray-200";
  const muted = dark ? "text-white/60" : "text-gray-500";
  const field = dark ? "bg-[#121622] border-white/15 text-white placeholder:text-white/40" : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400";

  const openDetail = (id: number) => { setView({ kind: "detail", id }); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className={`${bg} min-h-screen transition-colors duration-300`}>
      {/* skip for a11y */}
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white">Skip to content</a>

      {/* HEADER */}
      <header className={dark ? "sticky top-0 z-50 border-b border-white/10 bg-[#0A0C11]/90 backdrop-blur-xl" : "sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-xl"}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <button onClick={() => setView({ kind: "home" })} className="flex items-center gap-2 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600" aria-label="SideProjectors home">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white"><Sparkles className="h-4 w-4" /></span>
            <span className="font-display text-xl font-bold tracking-tight">SideProjectors</span>
          </button>

          <nav className="hidden items-center gap-1 text-sm lg:flex" aria-label="Primary">
            {["Home","Browse","Featured","For Sale","Latest","Makers","Articles"].map((n) => (
              <button key={n} onClick={() => setView({ kind: "home" })} className={`min-h-[40px] rounded-full px-3 py-2 transition hover:scale-[1.02] active:scale-95 ${dark ? "hover:bg-white/10" : "hover:bg-gray-100"}`}>{n}</button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={() => setDark(!dark)} aria-label="Toggle dark mode" aria-pressed={dark} className={`grid h-10 w-10 place-items-center rounded-full border transition active:scale-95 ${dark ? "border-white/15 hover:bg-white/10" : "border-gray-200 hover:bg-gray-100"}`}>
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button onClick={() => showToast("Sell flow — listing wizard (mock)")} className="hidden rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 active:scale-95 transition sm:block">Sell a project</button>
            <button onClick={() => showToast("Login (mock)")} className={`hidden min-h-[40px] rounded-full px-3 text-sm font-medium md:block ${muted}`}>Login</button>
            <button onClick={() => showToast("Register (mock)")} className={`hidden min-h-[40px] rounded-full border px-3 text-sm font-semibold md:block ${dark ? "border-white/20" : "border-gray-300"}`}>Register</button>
            <button onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-controls="mobile-menu" aria-label="Open menu" className="grid h-10 w-10 place-items-center rounded-full border border-gray-300 lg:hidden">
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav id="mobile-menu" className={`border-t px-4 py-3 lg:hidden ${dark ? "border-white/10 bg-[#0A0C11]" : "border-gray-200 bg-white"}`}>
            <div className="grid gap-1 text-sm">
              {["Home","Browse","Featured","For Sale","Latest","Makers","Articles","Sell a project"].map(n => (
                <button key={n} onClick={() => { setMobileOpen(false); setView({ kind: "home" }); }} className="min-h-[44px] rounded-xl text-left px-3 py-2 hover:bg-blue-600 hover:text-white transition">{n}</button>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main id="main" className="mx-auto max-w-7xl px-4 sm:px-6">
        {view.kind === "home" && (
          <>
            {/* HERO — Cinematic type (Bricolage, tracking-aware) */}
            <section className="pt-10 pb-6 text-center sm:pt-14" aria-labelledby="hero">
              <p className={`mb-3 text-xs font-bold uppercase tracking-[0.22em] ${dark ? "text-blue-300" : "text-blue-600"}`}>Marketplace · Est. 2025</p>
              <h1 id="hero" className="font-display text-4xl font-bold leading-[0.95] tracking-[-0.03em] sm:text-6xl sm:leading-[0.92]">
                Buy and Sell<br /><span className={dark ? "text-blue-300" : "text-blue-600"}>Side Projects</span>
              </h1>
              <p className={`mx-auto mt-4 max-w-2xl text-base sm:text-lg ${muted}`}>The #1 digital product marketplace. Zero fees. Real revenue data. Passive businesses you can buy today.</p>
              <div className="mx-auto mt-6 flex max-w-xl items-center gap-2">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
                  <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} placeholder='Search "Shopify", "AI", "passive"…'
                    aria-label="Search projects"
                    className={`h-12 w-full rounded-full border pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 ${field}`} />
                </div>
                <button onClick={() => showToast("Search saved (mock)")} className="hidden min-h-[48px] items-center gap-2 rounded-full border px-4 text-sm font-semibold sm:inline-flex active:scale-95 transition">
                  <Bookmark className="h-4 w-4" /> Save search
                </button>
              </div>
              <p className={`mt-3 text-sm ${muted}`} role="status">Found <strong>{filtered.length}</strong> projects {query && <>for “{query}”</>}</p>
            </section>

            {/* FILTER BAR — sticky, materials */}
            <section className={`sticky top-[65px] z-30 rounded-2xl border p-4 shadow-sm ${card}`} aria-label="Filters">
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold"><Filter className="h-4 w-4" /> Filters</span>
                <button onClick={() => { setQuery(""); setPostType("all"); setTypeFilter("All"); setPriceRange("All"); setRevenueRange("All"); setHoursFilter("All"); setSortBy("Newest"); setPage(1); }}
                  className="text-sm font-medium text-blue-600 hover:underline">Reset all</button>
              </div>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Post type">
                {(["all","sell","sold","cofounder","showcase"] as const).map(pt => (
                  <button key={pt} role="radio" aria-checked={postType === pt} onClick={() => { setPostType(pt as any); setPage(1); }}
                    className={`min-h-[36px] rounded-full px-3.5 text-sm font-semibold capitalize transition active:scale-95 ${postType === pt ? "bg-blue-600 text-white" : dark ? "bg-white/10 hover:bg-white/20" : "bg-gray-100 hover:bg-gray-200"}`}>
                    {pt === "all" ? "All" : pt === "sell" ? "For Sale" : pt === "sold" ? "Sold" : pt === "cofounder" ? "Co-founder" : "Showcase"}
                  </button>
                ))}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <label className="text-xs font-semibold">Type
                  <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value as any); setPage(1); }} aria-label="Project type"
                    className={`mt-1 h-10 w-full rounded-xl border px-3 text-sm ${field}`}>
                    {["All","SaaS","Shop","Blog","Website","Mobile","Desktop","Browser","Domain","Other"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold">Price
                  <select value={priceRange} onChange={e => { setPriceRange(e.target.value); setPage(1); }} aria-label="Price range"
                    className={`mt-1 h-10 w-full rounded-xl border px-3 text-sm ${field}`}>
                    {["All","Under $1000","$1000-5000","$5000-10000","$10000+"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold">Revenue
                  <select value={revenueRange} onChange={e => { setRevenueRange(e.target.value); setPage(1); }} aria-label="Revenue range"
                    className={`mt-1 h-10 w-full rounded-xl border px-3 text-sm ${field}`}>
                    {["All","0-1000","1000-5000","5000-10000","10000+"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold">Hours / week
                  <select value={hoursFilter} onChange={e => { setHoursFilter(e.target.value); setPage(1); }} aria-label="Hours per week"
                    className={`mt-1 h-10 w-full rounded-xl border px-3 text-sm ${field}`}>
                    {["All","Under 5","5-10","10-20","20-40"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold">Sort by
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort projects"
                    className={`mt-1 h-10 w-full rounded-xl border px-3 text-sm ${field}`}>
                    {["Newest","Price low-high","Price high-low","Revenue"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className={`text-xs ${muted}`}>{filtered.length} results · Page {page} of {totalPages}</span>
                <div className="flex items-center gap-1" aria-label="View toggle">
                  <button onClick={() => setLayout("list")} aria-pressed={layout === "list"} aria-label="List view" className={`grid h-9 w-9 place-items-center rounded-lg transition active:scale-95 ${layout === "list" ? "bg-blue-600 text-white" : dark ? "bg-white/10" : "bg-gray-100"}`}><List className="h-4 w-4" /></button>
                  <button onClick={() => setLayout("grid")} aria-pressed={layout === "grid"} aria-label="Grid view" className={`grid h-9 w-9 place-items-center rounded-lg transition active:scale-95 ${layout === "grid" ? "bg-blue-600 text-white" : dark ? "bg-white/10" : "bg-gray-100"}`}><Grid className="h-4 w-4" /></button>
                </div>
              </div>
            </section>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_300px]">
              {/* LIST */}
              <div>
                {pageItems.length === 0 && (
                  <div className={`rounded-3xl border p-12 text-center ${card}`}>
                    <SearchIcon className="mx-auto mb-3 h-8 w-8 opacity-30" />
                    <p className="font-display text-xl font-bold">No projects match</p>
                    <p className={`mt-1 text-sm ${muted}`}>Try clearing a filter or searching “Shopify”.</p>
                    <button onClick={() => { setQuery(""); setPostType("all"); setTypeFilter("All"); }} className="mt-4 min-h-[44px] rounded-full bg-blue-600 px-5 font-semibold text-white active:scale-95">Clear filters</button>
                  </div>
                )}

                <ul className={layout === "grid" ? "grid gap-5 sm:grid-cols-2" : "space-y-5"} role="list">
                  {pageItems.map((p, i) => {
                    const sold = p.postType === "sold";
                    const isCard = layout === "grid";
                    return (
                      <>
                        {i === 4 && layout === "list" && (
                          <li key={`ad-${i}`} className={`rounded-3xl border border-dashed p-6 text-center ${card}`} aria-label="Sponsored">
                            <p className={`text-xs uppercase tracking-[0.2em] ${muted}`}>From our sponsor</p>
                            <p className="mt-2 font-display text-xl font-bold">Custom-built marketplace platform</p>
                            <p className={`text-sm ${muted}`}>Live platform. Skip 12 months of design and development.</p>
                            <button onClick={() => showToast("Sponsor (mock)")} className="mt-3 min-h-[40px] rounded-full bg-blue-600 px-5 text-sm font-semibold text-white active:scale-95">View offer</button>
                          </li>
                        )}
                        <li key={p.id}>
                          <article onClick={() => openDetail(p.id)} className={`group relative cursor-pointer rounded-3xl border p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus-within:ring-2 focus-within:ring-blue-600 ${card} ${isCard ? "flex flex-col" : "flex flex-col sm:flex-row gap-4"}`} tabIndex={0}
                            onKeyDown={e => e.key === "Enter" && openDetail(p.id)} aria-label={`Open ${p.name}`}>
                            {sold && (
                              <span className="absolute -top-3 right-4 z-10 rounded-full bg-orange-600 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-white">🎉 Sold!</span>
                            )}
                            <div className="shrink-0 overflow-hidden rounded-2xl">
                              <img src={p.img} alt={p.name} loading="lazy" className={`w-full object-cover transition duration-500 group-hover:scale-105 ${isCard ? "h-44" : "h-36 sm:h-[120px] sm:w-40"}`} />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-between">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <h3 className="truncate font-display text-lg font-bold leading-tight tracking-tight">{p.name}</h3>
                                  <p className={`mt-1 line-clamp-2 text-sm ${muted}`}>{p.pitch}</p>
                                </div>
                                <button onClick={e => { e.stopPropagation(); toggleLike(p.id); }} aria-pressed={liked.has(p.id)} aria-label={`Like ${p.name}`}
                                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition active:scale-90 ${liked.has(p.id) ? "bg-rose-500 text-white" : dark ? "bg-white/10" : "bg-gray-100"}`}>
                                  <Heart className={`h-4 w-4 ${liked.has(p.id) ? "fill-current" : ""}`} />
                                </button>
                              </div>
                              <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs ${muted}`}>
                                <button onClick={e => { e.stopPropagation(); setView({ kind: "seller", seller: p.seller }); }} className="flex items-center gap-1.5 font-semibold hover:underline">
                                  <img src={p.avatar} alt="" className="h-5 w-5 rounded-full" /> {p.seller}
                                  {p.verified && <BadgeCheck className="h-3.5 w-3.5 text-blue-500" aria-label="Identity verified" />}
                                </button>
                                <span className="flex items-center gap-1"><TypeIcon t={p.type} /> {p.type}</span>
                                <span>{timeAgo(p.date)}</span>
                                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {p.views.toLocaleString()}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.hours}h/wk</span>
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${sold ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"}`}>{formatPrice(p)} · {p.priceType}</span>
                                <span className={`rounded-full px-2.5 py-1 text-xs ${dark ? "bg-white/10" : "bg-gray-100"}`}>Rev {p.revenueRange} · {p.visitors} visits</span>
                              </div>
                            </div>
                          </article>
                        </li>
                      </>
                    );
                  })}
                </ul>

                {/* Pagination */}
                <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} aria-label="Previous page" className="grid h-11 w-11 place-items-center rounded-full border disabled:opacity-30 active:scale-95"><ChevronLeft className="h-4 w-4" /></button>
                  {[1,2,3].map(n => (
                    <button key={n} onClick={() => setPage(n)} aria-current={page === n} className={`h-11 w-11 rounded-full font-bold transition active:scale-95 ${page === n ? "bg-blue-600 text-white" : dark ? "bg-white/10" : "bg-white border"}`}>{n}</button>
                  ))}
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} aria-label="Next page" className="grid h-11 w-11 place-items-center rounded-full border disabled:opacity-30 active:scale-95"><ChevronRight className="h-4 w-4" /></button>
                </nav>
              </div>

              {/* SIDEBAR */}
              <aside className="space-y-6 lg:sticky lg:top-40 lg:self-start" aria-label="Sidebar">
                <section className={`rounded-3xl border p-5 ${card}`}>
                  <h3 className="flex items-center gap-2 font-display font-bold"><TrendingUp className="h-4 w-4 text-blue-600" /> Featured</h3>
                  <ul className="mt-4 space-y-3">
                    {BASE.filter(p => p.featured).slice(0,5).map(p => (
                      <li key={p.id}><button onClick={() => openDetail(p.id)} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-blue-600/5 active:scale-[0.98]">
                        <img src={p.img} alt="" className="h-12 w-12 rounded-xl object-cover" />
                        <span className="min-w-0"><span className="block truncate text-sm font-bold">{p.name}</span><span className={`block truncate text-xs ${muted}`}>{formatPrice(p)} · {p.type}</span></span>
                      </button></li>
                    ))}
                  </ul>
                </section>

                <section className={`rounded-3xl border p-5 ${card}`}>
                  <h3 className="font-display font-bold">Browse by Type</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {["SaaS","Shop","Blog","Website","Mobile","Desktop","Browser","Domain","Other"].map(t => (
                      <button key={t} onClick={() => { setTypeFilter(t as ProjectType); setPage(1); window.scrollTo({top:600,behavior:"smooth"}); }}
                        className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold transition active:scale-95 ${typeFilter === t ? "bg-blue-600 text-white border-blue-600" : dark ? "border-white/15 hover:bg-white/10" : "border-gray-200 hover:bg-gray-50"}`}>{t}</button>
                    ))}
                  </div>
                </section>

                <section className={`rounded-3xl border p-5 ${card}`}>
                  <h3 className="font-display font-bold">Why Choose Us</h3>
                  <ul className={`mt-3 space-y-2.5 text-sm ${muted}`}>
                    <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" /> Curated & identity-verified sellers</li>
                    <li className="flex gap-2"><BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" /> Proven revenue, real traffic data</li>
                    <li className="flex gap-2"><Users className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" /> Active community of makers</li>
                  </ul>
                </section>

                <section className={`rounded-3xl border p-5 ${card}`} aria-label="FAQ">
                  <h3 className="font-display font-bold">FAQ</h3>
                  <div className="mt-3 space-y-2">
                    {[
                      ["How does SideProjectors work?", "Buyers browse proven projects with revenue proof. Sellers list with code, domain, and docs. Deals close off-platform in this mock — real site uses escrow."],
                      ["What types can I find?", "SaaS, Shops, Blogs, Websites, Mobile, Desktop, Browser extensions, Domains and Other — from $150 to $65k."],
                      ["How do I price my project?", "Use revenue × 2–3 for profitable, or replacement cost for pre-revenue. Most sold here are negotiable."],
                      ["How do I sell?", "Create an account, submit with screenshots, revenue proof, and tech stack for approval."],
                    ].map(([q, a], i) => (
                      <div key={i} className={`rounded-2xl border ${dark ? "border-white/10" : "border-gray-200"}`}>
                        <button onClick={() => toggleFaq(i)} aria-expanded={faqOpen.has(i)} className="flex min-h-[44px] w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold">
                          {q} <span aria-hidden>{faqOpen.has(i) ? "−" : "+"}</span>
                        </button>
                        {faqOpen.has(i) && <p className={`px-4 pb-4 text-sm ${muted}`}>{a}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </div>
          </>
        )}

        {/* DETAIL */}
        {view.kind === "detail" && detailProject && (
          <section className="py-8" aria-labelledby="detail-name">
            <button onClick={() => setView({ kind: "home" })} className="flex min-h-[44px] items-center gap-2 rounded-full px-2 text-sm font-semibold text-blue-600 hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to results
            </button>

            <div className={`relative mt-4 overflow-hidden rounded-[32px] border ${card}`}>
              {detailProject.postType === "sold" && (
                <div className="absolute inset-x-0 top-0 z-10 bg-orange-600 py-2 text-center text-sm font-extrabold uppercase tracking-widest text-white">🎉 Sold — make an offer for similar</div>
              )}
              <div className={detailProject.postType === "sold" ? "h-44" : "h-0"} />
              <img src={detailProject.img.replace("/400/300","/1200/600")} alt={detailProject.name} className="h-64 w-full object-cover sm:h-80" />
              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 id="detail-name" className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{detailProject.name}</h2>
                    <p className={`mt-2 max-w-2xl ${muted}`}>{detailProject.pitch}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-blue-600 px-3 py-1 font-bold text-white">{detailProject.type}</span>
                      <span className={`rounded-full px-3 py-1 ${dark ? "bg-white/10" : "bg-gray-100"}`}>{detailProject.market}</span>
                      <span className={`rounded-full px-3 py-1 ${dark ? "bg-white/10" : "bg-gray-100"}`}>{detailProject.date}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold">{formatPrice(detailProject)}</p>
                    <p className={`text-sm ${muted}`}>{detailProject.priceType} · Rev {detailProject.revenueRange}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button onClick={() => showToast("Offer sent (mock)")} className="min-h-[48px] flex-1 rounded-full bg-blue-600 px-6 font-bold text-white hover:bg-blue-700 active:scale-95 transition sm:flex-none">Make Offer</button>
                  <button onClick={() => showToast(detailProject.postType === "sold" ? "Join waitlist (mock)" : "Buy Now (mock)")} className={`min-h-[48px] flex-1 rounded-full border px-6 font-bold active:scale-95 transition sm:flex-none ${dark ? "border-white/20 hover:bg-white/10" : "border-gray-300 hover:bg-gray-50"}`}>{detailProject.postType === "sold" ? "Buy Similar" : "Buy Now"}</button>
                  <button onClick={() => showToast(`Contacted ${detailProject.seller} (mock)`)} className={`min-h-[48px] rounded-full border px-6 font-semibold active:scale-95 transition ${dark ? "border-white/20 hover:bg-white/10" : "border-gray-300 hover:bg-gray-50"}`}>Contact Seller</button>
                  <button onClick={() => toggleLike(detailProject.id)} aria-pressed={liked.has(detailProject.id)} aria-label="Like project" className={`grid h-12 w-12 place-items-center rounded-full border active:scale-90 transition ${liked.has(detailProject.id) ? "bg-rose-500 text-white border-rose-500" : dark ? "border-white/20" : "border-gray-300"}`}>
                    <Heart className={`h-5 w-5 ${liked.has(detailProject.id) ? "fill-current" : ""}`} />
                  </button>
                </div>

                {/* Stats */}
                <dl className={`mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 ${""}`}>
                  {[
                    ["Price", formatPrice(detailProject)],
                    ["Revenue / mo", `$${detailProject.revenueMonthly.toLocaleString()}`],
                    ["Profit margin", `${detailProject.profitMargin}%`],
                    ["Visitors", detailProject.visitors],
                    ["Hours / week", detailProject.hours],
                    ["Created", detailProject.date],
                    ["Type", detailProject.type],
                    ["Market", detailProject.market],
                  ].map(([k, v]) => (
                    <div key={k} className={`rounded-2xl border p-4 ${dark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`}>
                      <dt className={`text-xs uppercase tracking-wider ${muted}`}>{k}</dt>
                      <dd className="mt-1 font-display text-lg font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
                  <div>
                    <h3 className="font-display text-xl font-bold">Description</h3>
                    <p className={`mt-3 leading-relaxed ${muted}`}>{detailProject.description}</p>
                    <p className={`mt-4 leading-relaxed ${muted}`}>Traffic comes from organic search and social. The business runs on {detailProject.tech.join(", ")}. Handover includes all accounts, analytics, and 1 week of support. Ideal for a buyer who wants passive income without building from zero.</p>

                    <h3 className="mt-10 font-display text-xl font-bold">Proof</h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <figure>
                        <img src={`https://picsum.photos/seed/proof${detailProject.id}/600/400`} alt="Revenue proof screenshot" className="w-full rounded-2xl border object-cover" loading="lazy" />
                        <figcaption className={`mt-2 text-xs ${muted}`}>Revenue proof — Stripe / AdSense (mock)</figcaption>
                      </figure>
                      <figure>
                        <img src={`https://picsum.photos/seed/traffic${detailProject.id}/600/400`} alt="Traffic screenshot" className="w-full rounded-2xl border object-cover" loading="lazy" />
                        <figcaption className={`mt-2 text-xs ${muted}`}>Traffic analytics (mock)</figcaption>
                      </figure>
                    </div>

                    <h3 className="mt-10 font-display text-xl font-bold">Assets included</h3>
                    <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                      {[
                        ["Domain", detailProject.assets.domain],
                        ["Source code", detailProject.assets.code],
                        ["Social accounts", detailProject.assets.socials],
                        ["Supplier connections", detailProject.assets.supplier],
                        ["Marketing plan", detailProject.assets.marketing],
                        ["Brand / logo", detailProject.assets.brand],
                        ["Documentation", detailProject.assets.docs],
                      ].map(([label, ok]) => (
                        <li key={label as string} className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm ${dark ? "border-white/10" : "border-gray-200"} ${ok ? "" : "opacity-45"}`}>
                          <span className={`grid h-6 w-6 place-items-center rounded-full ${ok ? "bg-emerald-500 text-white" : "bg-gray-300 text-white"}`}><Check className="h-3.5 w-3.5" /></span>
                          {label as string} {ok ? "" : "— not included"}
                        </li>
                      ))}
                    </ul>

                    <h3 className="mt-10 font-display text-xl font-bold">Tech stack</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {detailProject.tech.map(t => <span key={t} className="rounded-full border border-blue-600 px-3 py-1 text-sm font-semibold text-blue-600">{t}</span>)}
                    </div>
                  </div>

                  <aside className={`h-fit rounded-3xl border p-5 ${dark ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"}`} aria-label="Seller">
                    <h3 className="font-display font-bold">Seller</h3>
                    <button onClick={() => setView({ kind: "seller", seller: detailProject.seller })} className="mt-4 flex w-full items-center gap-3 rounded-2xl p-2 text-left transition hover:bg-blue-600/5 active:scale-[0.98]">
                      <img src={detailProject.avatar} alt="" className="h-12 w-12 rounded-full" />
                      <span className="flex-1">
                        <span className="flex items-center gap-1.5 font-bold">{detailProject.seller} {detailProject.verified && <BadgeCheck className="h-4 w-4 text-blue-500" />}</span>
                        <span className={`block text-xs ${muted}`}>Member since {detailProject.memberSince} · {BASE.filter(p => p.seller === detailProject.seller).length} listings</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4" />
                    </button>
                    <p className={`mt-3 flex items-center gap-2 text-xs ${muted}`}><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> 4.9 · Verified deals · Fast response</p>
                    <button onClick={() => showToast("Message sent (mock)")} className="mt-4 min-h-[44px] w-full rounded-full bg-blue-600 font-bold text-white active:scale-95">Message seller</button>
                  </aside>
                </div>
              </div>
            </div>

            {/* Similar — horizontal scroll, momentum-friendly */}
            <h3 className="mt-12 font-display text-2xl font-bold tracking-tight">Similar projects</h3>
            <div className="mt-4 flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {BASE.filter(p => p.id !== detailProject.id && p.type === detailProject.type).slice(0,6).map(p => (
                <button key={p.id} onClick={() => openDetail(p.id)} className={`w-64 shrink-0 rounded-3xl border p-3 text-left transition hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] ${card}`}>
                  <img src={p.img} alt={p.name} className="h-36 w-full rounded-2xl object-cover" loading="lazy" />
                  <p className="mt-3 truncate font-bold">{p.name}</p>
                  <p className={`truncate text-sm ${muted}`}>{formatPrice(p)} · {p.type}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* SELLER */}
        {view.kind === "seller" && sellerInfo && (
          <section className="py-8" aria-labelledby="seller-name">
            <button onClick={() => setView({ kind: "home" })} className="flex min-h-[44px] items-center gap-2 rounded-full px-2 text-sm font-semibold text-blue-600 hover:underline">
              <ArrowLeft className="h-4 w-4" /> Back to marketplace
            </button>
            <div className={`mt-4 overflow-hidden rounded-[32px] border ${card}`}>
              <div className="h-36 bg-gradient-to-r from-blue-600 via-violet-600 to-orange-500" />
              <div className="p-6 sm:p-8">
                <div className="-mt-16 flex flex-wrap items-end gap-5">
                  <img src={sellerInfo.avatar} alt={sellerInfo.seller} className="h-24 w-24 rounded-3xl border-4 border-white shadow-xl" />
                  <div className="flex-1">
                    <h2 id="seller-name" className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight">{sellerInfo.seller} {sellerInfo.verified && <BadgeCheck className="h-6 w-6 text-blue-500" />}</h2>
                    <p className={`mt-1 text-sm ${muted}`}>Maker · Member since {sellerInfo.memberSince} · {sellerProjects.length} listings</p>
                  </div>
                  <button onClick={() => showToast("Followed (mock)")} className="min-h-[44px] rounded-full bg-blue-600 px-6 font-bold text-white active:scale-95">Follow</button>
                  <button onClick={() => showToast("Message sent (mock)")} className={`min-h-[44px] rounded-full border px-6 font-semibold active:scale-95 ${dark ? "border-white/20" : "border-gray-300"}`}>Message</button>
                </div>
                <p className={`mt-5 max-w-2xl leading-relaxed ${muted}`}>Building profitable side projects since {sellerInfo.memberSince}. Focus: e-commerce, content, and automation. Happy to share suppliers, ad playbooks, and handover docs.</p>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[
                    ["Projects sold", BASE.filter(p => p.seller === sellerInfo.seller && p.postType === "sold").length.toString()],
                    ["Revenue proven", `$${(sellerProjects.reduce((s,p)=>s+p.revenueMonthly,0)).toLocaleString()}/mo`],
                    ["Avg margin", `${Math.round(sellerProjects.reduce((s,p)=>s+p.profitMargin,0)/Math.max(1,sellerProjects.length))}%`],
                  ].map(([k,v]) => (
                    <div key={k} className={`rounded-2xl border p-4 text-center ${dark ? "border-white/10" : "border-gray-200 bg-gray-50"}`}><p className="font-display text-2xl font-bold">{v}</p><p className={`text-xs ${muted}`}>{k}</p></div>
                  ))}
                </div>
                <h3 className="mt-10 font-display text-2xl font-bold tracking-tight">All projects by {sellerInfo.seller}</h3>
                <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {sellerProjects.map(p => (
                    <button key={p.id} onClick={() => openDetail(p.id)} className={`overflow-hidden rounded-3xl border text-left transition hover:-translate-y-1 hover:shadow-xl active:scale-[0.98] ${card}`}>
                      <img src={p.img} alt={p.name} className="h-44 w-full object-cover" loading="lazy" />
                      <div className="p-4">
                        <p className="truncate font-bold">{p.name}</p>
                        <p className={`truncate text-sm ${muted}`}>{formatPrice(p)} · {p.postType}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className={dark ? "mt-16 border-t border-white/10 bg-[#0A0C11]" : "mt-16 border-t border-gray-200 bg-white"}>
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
          <div>
            <p className="flex items-center gap-2 font-display text-lg font-bold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-white"><Sparkles className="h-3.5 w-3.5" /></span> SideProjectors</p>
            <p className={`mt-3 text-sm leading-relaxed ${muted}`}>The #1 digital product marketplace. Buy and sell side projects from developers worldwide.</p>
          </div>
          {[
            ["For Users", ["Browse","Sell","Help","Contact us"]],
            ["Projects", ["SaaS","Website","Mobile app","E-commerce","Desktop","Blog","Domain","Browser"]],
            ["SideProjectors", ["About","Privacy Policy","Terms","GDPR","DMCA"]],
          ].map(([title, links]) => (
            <nav key={title as string} aria-label={title as string}>
              <p className="text-xs font-bold uppercase tracking-[0.18em]">{title}</p>
              <ul className={`mt-3 space-y-2 text-sm ${muted}`}>
                {(links as string[]).map(l => <li key={l}><button onClick={() => showToast(`${l} (mock)`)} className="hover:text-blue-600">{l}</button></li>)}
              </ul>
            </nav>
          ))}
        </div>
        <div className={`border-t py-5 text-center text-xs ${dark ? "border-white/10 text-white/40" : "border-gray-100 text-gray-500"}`}>
          © {new Date().getFullYear()} SideProjectors (demo). Mock data for UI — not affiliated with sideprojectors.com.
        </div>
      </footer>

      {/* Toast — live region */}
      <div aria-live="polite" className="pointer-events-none fixed bottom-5 left-1/2 z-[60] -translate-x-1/2">
        {toast && <div className="animate-fade-up rounded-full bg-ink-950 px-5 py-3 text-sm font-semibold text-white shadow-2xl">{toast}</div>}
      </div>
    </div>
  );
}
