import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Clear existing data
  await prisma.configurationOption.deleteMany()
  await prisma.configuration.deleteMany()
  await prisma.carOption.deleteMany()
  await prisma.carTranslation.deleteMany()
  await prisma.optionTranslation.deleteMany()
  await prisma.requiredGroup.deleteMany()
  await prisma.car.deleteMany()
  await prisma.option.deleteMany()
  await prisma.user.deleteMany()

  console.log('🗑️  Cleared existing data')

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@carconfigurator.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'admin',
      isRegistered: true // Admin is considered registered
    }
  })

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10)
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@carconfigurator.com',
      name: 'Demo User',
      password: demoPassword,
      role: 'user',
      isRegistered: false // Mark as demo user
    }
  })

  console.log('👤 Created users')

  // Create sample cars with enhanced data
  const luxuryX5 = await prisma.car.create({
    data: {
      name: 'Luxury X5 SUV',
      category: 'SUV',
      basePrice: 58900,
      description: 'Der Luxury X5 kombiniert sportliche Eleganz mit modernster Technologie. Mit seinem kraftvollen Design und der luxuriösen Ausstattung setzt er neue Maßstäbe in der Premium-SUV-Klasse.',
      imageUrl: '/images/cars/luxury-x5.jpg',
      translations: {
        create: [
          {
            locale: 'en',
            name: 'Luxury X5 SUV',
            category: 'SUV',
            description: 'The Luxury X5 combines sporty elegance with cutting-edge technology. With its powerful design and luxurious equipment, it sets new standards in the premium SUV class.'
          },
          {
            locale: 'de',
            name: 'Luxury X5 SUV',
            category: 'SUV',
            description: 'Der Luxury X5 kombiniert sportliche Eleganz mit modernster Technologie. Mit seinem kraftvollen Design und der luxuriösen Ausstattung setzt er neue Maßstäbe in der Premium-SUV-Klasse.'
          }
        ]
      }
    },
  })

  const eleganceSedan = await prisma.car.create({
    data: {
      name: 'Elegance Sedan',
      category: 'Limousine',
      basePrice: 42500,
      description: 'Die perfekte Business-Limousine für anspruchsvolle Fahrer. Elegantes Design trifft auf modernste Assistenzsysteme und außergewöhnlichen Komfort.',
      imageUrl: '/images/cars/elegance-sedan.jpg',
      translations: {
        create: [
          {
            locale: 'en',
            name: 'Elegance Sedan',
            category: 'Sedan',
            description: 'The perfect business sedan for demanding drivers. Elegant design meets cutting-edge assistance systems and exceptional comfort.'
          },
          {
            locale: 'de',
            name: 'Elegance Sedan',
            category: 'Limousine',
            description: 'Die perfekte Business-Limousine für anspruchsvolle Fahrer. Elegantes Design trifft auf modernste Assistenzsysteme und außergewöhnlichen Komfort.'
          }
        ]
      }
    },
  })

  const prestigeCoupe = await prisma.car.create({
    data: {
      name: 'Prestige Coupe',
      category: 'Coupe',
      basePrice: 72000,
      description: 'Exklusives Sportcoupe für Liebhaber außergewöhnlicher Fahrdynamik. Jede Linie wurde für maximale Performance und Ästhetik gestaltet.',
      imageUrl: '/images/cars/prestige-coupe.jpg',
      translations: {
        create: [
          {
            locale: 'en',
            name: 'Prestige Coupe',
            category: 'Coupe',
            description: 'Exclusive sports coupe for lovers of exceptional driving dynamics. Every line has been designed for maximum performance and aesthetics.'
          },
          {
            locale: 'de',
            name: 'Prestige Coupe',
            category: 'Coupe',
            description: 'Exklusives Sportcoupe für Liebhaber außergewöhnlicher Fahrdynamik. Jede Linie wurde für maximale Performance und Ästhetik gestaltet.'
          }
        ]
      }
    },
  })

  console.log('🚗 Created cars')

  // Create comprehensive options
  const options = await Promise.all([
    // Engine options
    prisma.option.create({
      data: {
        name: 'Sportmotor 3.0L V6',
        category: 'Motor',
        price: 8500,
        description: 'Hochleistungs-V6-Motor mit 350 PS für sportliche Fahrdynamik',
        detailedDescription: 'Der neue 3.0L V6 Sportmotor entwickelt beeindruckende 350 PS und 480 Nm Drehmoment. Mit modernster Twin-Turbo-Technologie und direkter Kraftstoffeinspritzung bietet er eine außergewöhnliche Leistungsausbeute bei optimierter Effizienz. Das sportlich abgestimmte Fahrwerk in Verbindung mit dem adaptiven Sportauspuff sorgt für ein unvergessliches Fahrerlebnis. 0-100 km/h in nur 5,2 Sekunden.',
        imageUrl: '/images/options/sport-engine.png',
        exclusiveGroup: 'engine', // Motors exclude each other
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Sport Engine 3.0L V6',
              category: 'Engine',
              description: 'High-performance V6 engine with 350 HP for sporty driving dynamics',
              detailedDescription: 'The new 3.0L V6 sport engine develops impressive 350 HP and 480 Nm of torque. With state-of-the-art twin-turbo technology and direct fuel injection, it offers exceptional power output with optimized efficiency. The sport-tuned chassis combined with the adaptive sport exhaust provides an unforgettable driving experience. 0-100 km/h in just 5.2 seconds.'
            },
            {
              locale: 'de',
              name: 'Sportmotor 3.0L V6',
              category: 'Motor',
              description: 'Hochleistungs-V6-Motor mit 350 PS für sportliche Fahrdynamik',
              detailedDescription: 'Der neue 3.0L V6 Sportmotor entwickelt beeindruckende 350 PS und 480 Nm Drehmoment. Mit modernster Twin-Turbo-Technologie und direkter Kraftstoffeinspritzung bietet er eine außergewöhnliche Leistungsausbeute bei optimierter Effizienz. Das sportlich abgestimmte Fahrwerk in Verbindung mit dem adaptiven Sportauspuff sorgt für ein unvergessliches Fahrerlebnis. 0-100 km/h in nur 5,2 Sekunden.'
            }
          ]
        }
      },
    }),
    prisma.option.create({
      data: {
        name: 'Hybrid-Antrieb',
        category: 'Motor',
        price: 5000,
        description: 'Umweltfreundlicher Hybrid-Antrieb für optimale Effizienz und reduzierten Verbrauch',
        detailedDescription: 'Das innovative Hybrid-System kombiniert einen 2.0L Benzinmotor mit einem leistungsstarken Elektromotor für eine Gesamtleistung von 250 PS. Der intelligente Energiemanager optimiert automatisch den Wechsel zwischen Elektro- und Verbrennungsmotor. Durchschnittsverbrauch: nur 3,8L/100km. Elektrische Reichweite: bis zu 50km. Regenerative Bremstechnologie lädt die Batterie während der Fahrt auf.',
        imageUrl: '/images/options/hybrid.png',
        exclusiveGroup: 'engine', // Motors exclude each other
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Hybrid Drive',
              category: 'Engine',
              description: 'Eco-friendly hybrid drive for optimal efficiency and reduced consumption',
              detailedDescription: 'The innovative hybrid system combines a 2.0L gasoline engine with a powerful electric motor for a total output of 250 HP. The intelligent energy manager automatically optimizes the switching between electric and combustion engine. Average consumption: only 3.8L/100km. Electric range: up to 50km. Regenerative braking technology charges the battery while driving.'
            },
            {
              locale: 'de',
              name: 'Hybrid-Antrieb',
              category: 'Motor',
              description: 'Umweltfreundlicher Hybrid-Antrieb für optimale Effizienz und reduzierten Verbrauch'
            }
          ]
        }
      },
    }),
    // Paint options
    prisma.option.create({
      data: {
        name: 'Metallic-Lackierung',
        category: 'Außenausstattung',
        price: 1200,
        description: 'Hochwertige Metallic-Lackierung in verschiedenen Farben für einen eleganten Glanz',
        detailedDescription: 'Die Premium Metallic-Lackierung verleiht Ihrem Fahrzeug einen außergewöhnlichen Glanz und Tiefenwirkung. Der mehrschichtige Lackaufbau mit speziellen Metallic-Partikeln sorgt für brillante Farbwiedergabe und UV-Schutz. Verfügbar in 8 exklusiven Farbtönen: Alpinweiß, Obsidianschwarz, Mineralgrau, Mittelmeerblau, Rubinrot, Bernsteinbraun, Platingrau und Titansilber. Kratzfester Klarlack für langanhaltende Schönheit.',
        imageUrl: '/images/options/metallic-paint.png',
        exclusiveGroup: 'paint', // Paint options exclude each other
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Metallic Paint',
              category: 'Exterior',
              description: 'High-quality metallic paint in various colors for an elegant shine',
              detailedDescription: 'The premium metallic paint gives your vehicle an exceptional shine and depth effect. The multi-layer paint structure with special metallic particles ensures brilliant color reproduction and UV protection. Available in 8 exclusive color tones: Alpine White, Obsidian Black, Mineral Grey, Mediterranean Blue, Ruby Red, Amber Brown, Platinum Grey and Titanium Silver. Scratch-resistant clear coat for lasting beauty.'
            },
            {
              locale: 'de',
              name: 'Metallic-Lackierung',
              category: 'Außenausstattung',
              description: 'Hochwertige Metallic-Lackierung in verschiedenen Farben für einen eleganten Glanz',
              detailedDescription: 'Die Premium Metallic-Lackierung verleiht Ihrem Fahrzeug einen außergewöhnlichen Glanz und Tiefenwirkung. Der mehrschichtige Lackaufbau mit speziellen Metallic-Partikeln sorgt für brillante Farbwiedergabe und UV-Schutz. Verfügbar in 8 exklusiven Farbtönen: Alpinweiß, Obsidianschwarz, Mineralgrau, Mittelmeerblau, Rubinrot, Bernsteinbraun, Platingrau und Titansilber. Kratzfester Klarlack für langanhaltende Schönheit.'
            }
          ]
        }
      },
    }),
    prisma.option.create({
      data: {
        name: 'Perleffekt-Lackierung',
        category: 'Außenausstattung',
        price: 2000,
        description: 'Exklusive Perleffekt-Lackierung mit außergewöhnlichem Glanz und Tiefenwirkung',
        detailedDescription: 'Die exklusive Perleffekt-Lackierung ist die Königsklasse der Fahrzeuglackierung. Feinste Perlmutt-Partikel erzeugen ein faszinierendes Farbspiel, das je nach Lichteinfall und Betrachtungswinkel variiert. Der aufwendige 7-Schicht-Lackaufbau sorgt für maximale Farbtiefe und außergewöhnliche Haltbarkeit. Verfügbar in 5 exklusiven Tönen: Kristallweiß, Mysticblau, Champagner, Titanium und Imperial. Jede Lackierung wird von Hand poliert.',
        imageUrl: '/images/options/pearl-paint.png',
        exclusiveGroup: 'paint', // Paint options exclude each other
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Pearl Effect Paint',
              category: 'Exterior',
              description: 'Exclusive pearl effect paint with exceptional shine and depth',
              detailedDescription: 'The exclusive pearl effect paint is the royal class of vehicle painting. Finest mother-of-pearl particles create a fascinating color play that varies depending on light incidence and viewing angle. The elaborate 7-layer paint structure ensures maximum color depth and exceptional durability. Available in 5 exclusive tones: Crystal White, Mystic Blue, Champagne, Titanium and Imperial. Each paint job is hand-polished.'
            },
            {
              locale: 'de',
              name: 'Perleffekt-Lackierung',
              category: 'Außenausstattung',
              description: 'Exklusive Perleffekt-Lackierung mit außergewöhnlichem Glanz und Tiefenwirkung',
              detailedDescription: 'Die exklusive Perleffekt-Lackierung ist die Königsklasse der Fahrzeuglackierung. Feinste Perlmutt-Partikel erzeugen ein faszinierendes Farbspiel, das je nach Lichteinfall und Betrachtungswinkel variiert. Der aufwendige 7-Schicht-Lackaufbau sorgt für maximale Farbtiefe und außergewöhnliche Haltbarkeit. Verfügbar in 5 exklusiven Tönen: Kristallweiß, Mysticblau, Champagner, Titanium und Imperial. Jede Lackierung wird von Hand poliert.'
            }
          ]
        }
      },
    }),
    // Wheel options
    prisma.option.create({
      data: {
        name: '19" Sportfelgen',
        category: 'Felgen',
        price: 2500,
        description: 'Leichtmetallfelgen im Sportdesign, 19 Zoll, für verbesserte Performance',
        detailedDescription: 'Die 19" Sportfelgen kombinieren athletisches Design mit technischer Perfektion. Gefertigt aus einer speziellen Leichtmetall-Legierung sind sie bis zu 30% leichter als herkömmliche Stahlfelgen, was die ungefederten Massen reduziert und Fahrkomfort sowie Beschleunigung verbessert. Das aerodynamisch optimierte 5-Speichen-Design reduziert Luftwiderstand und Windgeräusche. Erhältlich in Hochglanz poliert, Anthrazit matt oder Titanium bicolor.',
        imageUrl: '/images/options/sport-wheels.png',
        exclusiveGroup: 'wheels', // Wheel options exclude each other
        translations: {
          create: [
            {
              locale: 'en',
              name: '19" Sport Wheels',
              category: 'Wheels',
              description: 'Alloy wheels in sport design, 19 inches, for improved performance',
              detailedDescription: 'The 19" sport wheels combine athletic design with technical perfection. Made from a special lightweight alloy, they are up to 30% lighter than conventional steel wheels, reducing unsprung mass and improving ride comfort and acceleration. The aerodynamically optimized 5-spoke design reduces air resistance and wind noise. Available in high-gloss polished, anthracite matt or titanium bicolor.'
            },
            {
              locale: 'de',
              name: '19" Sportfelgen',
              category: 'Felgen',
              description: 'Leichtmetallfelgen im Sportdesign, 19 Zoll, für verbesserte Performance',
              detailedDescription: 'Die 19" Sportfelgen kombinieren athletisches Design mit technischer Perfektion. Gefertigt aus einer speziellen Leichtmetall-Legierung sind sie bis zu 30% leichter als herkömmliche Stahlfelgen, was die ungefederten Massen reduziert und Fahrkomfort sowie Beschleunigung verbessert. Das aerodynamisch optimierte 5-Speichen-Design reduziert Luftwiderstand und Windgeräusche. Erhältlich in Hochglanz poliert, Anthrazit matt oder Titanium bicolor.'
            }
          ]
        }
      },
    }),
    prisma.option.create({
      data: {
        name: '20" Premium Felgen',
        category: 'Felgen',
        price: 3500,
        description: 'Exklusive 20-Zoll Felgen im Premium-Design für maximale Eleganz',
        detailedDescription: 'Die 20" Premium Felgen repräsentieren die Spitze des Felgendesigns. Jede Felge wird in einem aufwendigen Präzisionsgussverfahren hergestellt und anschließend CNC-gefräst für perfekte Balance. Das exklusive Y-Speichen-Design mit diamantpolierten Oberflächen verleiht jedem Fahrzeug eine unverwechselbare Eleganz. Die verstärkte Felgenkonstruktion ist auf höchste Belastungen ausgelegt. Verfügbar in Platinsilber oder Schwarz hochglanz mit diamantpolierten Speichen.',
        imageUrl: '/images/options/premium-wheels.png',
        exclusiveGroup: 'wheels', // Wheel options exclude each other
        translations: {
          create: [
            {
              locale: 'en',
              name: '20" Premium Wheels',
              category: 'Wheels',
              description: 'Exclusive 20-inch wheels in premium design for maximum elegance',
              detailedDescription: 'The 20" premium wheels represent the pinnacle of wheel design. Each wheel is manufactured using an elaborate precision casting process and then CNC-machined for perfect balance. The exclusive Y-spoke design with diamond-polished surfaces gives every vehicle a distinctive elegance. The reinforced wheel construction is designed for the highest loads. Available in platinum silver or black high gloss with diamond-polished spokes.'
            },
            {
              locale: 'de',
              name: '20" Premium Felgen',
              category: 'Felgen',
              description: 'Exklusive 20-Zoll Felgen im Premium-Design für maximale Eleganz',
              detailedDescription: 'Die 20" Premium Felgen repräsentieren die Spitze des Felgendesigns. Jede Felge wird in einem aufwendigen Präzisionsgussverfahren hergestellt und anschließend CNC-gefräst für perfekte Balance. Das exklusive Y-Speichen-Design mit diamantpolierten Oberflächen verleiht jedem Fahrzeug eine unverwechselbare Eleganz. Die verstärkte Felgenkonstruktion ist auf höchste Belastungen ausgelegt. Verfügbar in Platinsilber oder Schwarz hochglanz mit diamantpolierten Speichen.'
            }
          ]
        }
      },
    }),
    // Interior options
    prisma.option.create({
      data: {
        name: 'Leder-Ausstattung',
        category: 'Innenausstattung',
        price: 4500,
        description: 'Hochwertige Volleder-Ausstattung für luxuriösen Komfort',
        detailedDescription: 'Die exklusive Volleder-Ausstattung verwandelt den Innenraum in eine Luxus-Lounge. Verwendet wird nur feinste Nappa-Lederhaut aus nachhaltiger Produktion, die durch natürliche Gerbverfahren veredelt wird. Alle Sitze, Armaturenbrett-Verkleidungen und Türpaneele werden von Hand bezogen. Die ergonomisch geformten Sitze bieten 18-fach elektrische Verstellung, Massage-Funktion und Klimatisierung. Verfügbar in 6 eleganten Farben: Cognac, Schwarz, Alabaster, Mokka, Bernstein und Titanium.',
        imageUrl: '/images/options/leather-interior.png',
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Leather Interior',
              category: 'Interior',
              description: 'High-quality full leather interior for luxurious comfort',
              detailedDescription: 'The exclusive full leather interior transforms the cabin into a luxury lounge. Only the finest Nappa leather from sustainable production is used, refined through natural tanning processes. All seats, dashboard panels and door panels are hand-covered. The ergonomically shaped seats offer 18-way electric adjustment, massage function and climate control. Available in 6 elegant colors: Cognac, Black, Alabaster, Mocha, Amber and Titanium.'
            },
            {
              locale: 'de',
              name: 'Leder-Ausstattung',
              category: 'Innenausstattung',
              description: 'Hochwertige Volleder-Ausstattung für luxuriösen Komfort',
              detailedDescription: 'Die exklusive Volleder-Ausstattung verwandelt den Innenraum in eine Luxus-Lounge. Verwendet wird nur feinste Nappa-Lederhaut aus nachhaltiger Produktion, die durch natürliche Gerbverfahren veredelt wird. Alle Sitze, Armaturenbrett-Verkleidungen und Türpaneele werden von Hand bezogen. Die ergonomisch geformten Sitze bieten 18-fach elektrische Verstellung, Massage-Funktion und Klimatisierung. Verfügbar in 6 eleganten Farben: Cognac, Schwarz, Alabaster, Mokka, Bernstein und Titanium.'
            }
          ]
        }
      },
    }),
    prisma.option.create({
      data: {
        name: 'Panorama-Schiebedach',
        category: 'Komfort',
        price: 1800,
        description: 'Elektrisches Panorama-Schiebedach für ein offenes Fahrgefühl',
        detailedDescription: 'Das großflächige Panorama-Schiebedach erstreckt sich über die gesamte Fahrzeuglänge und bietet allen Insassen ein beeindruckendes Himmelserlebnis. Die elektrische Betätigung ermöglicht stufenlose Öffnung und Schließung per Knopfdruck. Das getönte Solarglas reduziert Wärmeeintrag um bis zu 60% und verfügt über eine integrierte Anti-Rutsch-Beschichtung für Regenwasser. Bei geöffnetem Dach sorgt der automatische Windabweiser für nahezu windstille Fahrt auch bei hohen Geschwindigkeiten.',
        imageUrl: '/images/options/panorama-roof.png',
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Panoramic Sunroof',
              category: 'Comfort',
              description: 'Electric panoramic sunroof for an open driving experience',
              detailedDescription: 'The large panoramic sunroof extends over the entire vehicle length and offers all occupants an impressive sky experience. Electric operation enables stepless opening and closing at the touch of a button. The tinted solar glass reduces heat input by up to 60% and has an integrated anti-slip coating for rainwater. When the roof is open, the automatic wind deflector ensures almost windless driving even at high speeds.'
            },
            {
              locale: 'de',
              name: 'Panorama-Schiebedach',
              category: 'Komfort',
              description: 'Elektrisches Panorama-Schiebedach für ein offenes Fahrgefühl',
              detailedDescription: 'Das großflächige Panorama-Schiebedach erstreckt sich über die gesamte Fahrzeuglänge und bietet allen Insassen ein beeindruckendes Himmelserlebnis. Die elektrische Betätigung ermöglicht stufenlose Öffnung und Schließung per Knopfdruck. Das getönte Solarglas reduziert Wärmeeintrag um bis zu 60% und verfügt über eine integrierte Anti-Rutsch-Beschichtung für Regenwasser. Bei geöffnetem Dach sorgt der automatische Windabweiser für nahezu windstille Fahrt auch bei hohen Geschwindigkeiten.'
            }
          ]
        }
      },
    }),
    // Technology options
    prisma.option.create({
      data: {
        name: 'Navigation Premium',
        category: 'Technologie',
        price: 2200,
        description: 'Premium-Navigationssystem mit Live-Traffic und 3D-Karten',
        detailedDescription: 'Das Premium-Navigationssystem mit 12,3" High-Resolution Display bietet kristallklare 3D-Kartendarstellung und Echtzeit-Verkehrsinformationen. Die künstliche Intelligenz lernt Ihre bevorzugten Routen und schlägt automatisch Alternativstrecken vor. Integrierte Services: Online-Kraftstoffpreise, Parkplatz-Finder, Wetterinformationen und Points of Interest. Voice Control ermöglicht natürliche Sprachsteuerung. Regelmäßige Over-the-Air Updates halten Karten und Software immer aktuell.',
        imageUrl: '/images/options/navigation.png',
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Premium Navigation',
              category: 'Technology',
              description: 'Premium navigation system with live traffic and 3D maps',
              detailedDescription: 'The premium navigation system with 12.3" high-resolution display offers crystal-clear 3D map display and real-time traffic information. The artificial intelligence learns your preferred routes and automatically suggests alternative routes. Integrated services: Online fuel prices, parking finder, weather information and points of interest. Voice Control enables natural voice control. Regular over-the-air updates keep maps and software always current.'
            },
            {
              locale: 'de',
              name: 'Navigation Premium',
              category: 'Technologie',
              description: 'Premium-Navigationssystem mit Live-Traffic und 3D-Karten',
              detailedDescription: 'Das Premium-Navigationssystem mit 12,3" High-Resolution Display bietet kristallklare 3D-Kartendarstellung und Echtzeit-Verkehrsinformationen. Die künstliche Intelligenz lernt Ihre bevorzugten Routen und schlägt automatisch Alternativstrecken vor. Integrierte Services: Online-Kraftstoffpreise, Parkplatz-Finder, Wetterinformationen und Points of Interest. Voice Control ermöglicht natürliche Sprachsteuerung. Regelmäßige Over-the-Air Updates halten Karten und Software immer aktuell.'
            }
          ]
        }
      },
    }),
    prisma.option.create({
      data: {
        name: 'Harman Kardon Soundsystem',
        category: 'Technologie',
        price: 1500,
        description: 'Premium-Soundsystem mit 16 Lautsprechern für audiophilen Genuss',
        detailedDescription: 'Das Harman Kardon Premium-Soundsystem transformiert Ihren Innenraum in eine Konzerthalle. 16 präzise abgestimmte Lautsprecher, darunter ein leistungsstarker Subwoofer, sorgen für kristallklaren Sound in jeder Frequenz. Die QuantumLogic Surround-Technologie erzeugt ein 360°-Klangerlebnis. Der 12-Kanal-Verstärker mit 600 Watt Gesamtleistung wird individuell für jede Fahrzeugakustik kalibriert. Verschiedene Sound-Modi optimieren die Wiedergabe für Klassik, Jazz, Rock oder Sprache.',
        imageUrl: '/images/options/harman-kardon.png',
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Harman Kardon Sound System',
              category: 'Technology',
              description: 'Premium sound system with 16 speakers for audiophile enjoyment',
              detailedDescription: 'The Harman Kardon premium sound system transforms your interior into a concert hall. 16 precisely tuned speakers, including a powerful subwoofer, ensure crystal-clear sound in every frequency. QuantumLogic Surround technology creates a 360° sound experience. The 12-channel amplifier with 600 watts total power is individually calibrated for each vehicle acoustics. Various sound modes optimize playback for classical, jazz, rock or speech.'
            },
            {
              locale: 'de',
              name: 'Harman Kardon Soundsystem',
              category: 'Technologie',
              description: 'Premium-Soundsystem mit 16 Lautsprechern für audiophilen Genuss',
              detailedDescription: 'Das Harman Kardon Premium-Soundsystem transformiert Ihren Innenraum in eine Konzerthalle. 16 präzise abgestimmte Lautsprecher, darunter ein leistungsstarker Subwoofer, sorgen für kristallklaren Sound in jeder Frequenz. Die QuantumLogic Surround-Technologie erzeugt ein 360°-Klangerlebnis. Der 12-Kanal-Verstärker mit 600 Watt Gesamtleistung wird individuell für jede Fahrzeugakustik kalibriert. Verschiedene Sound-Modi optimieren die Wiedergabe für Klassik, Jazz, Rock oder Sprache.'
            }
          ]
        }
      },
    }),
    // Safety options
    prisma.option.create({
      data: {
        name: 'Fahrassistenz-Paket Plus',
        category: 'Sicherheit',
        price: 3200,
        description: 'Erweiterte Fahrassistenzsysteme für maximale Sicherheit',
        detailedDescription: 'Das Fahrassistenz-Paket Plus vereint modernste Sicherheitstechnologien für autonomes Fahren Level 2. Adaptive Geschwindigkeitsregelung mit Stop&Go-Funktion, Spurhalteassistent mit Lenkkorrektur, Totwinkel-Überwachung mit Ausweichunterstützung, Notbremsassistent mit Fußgängererkennung, Müdigkeitserkennung, automatischer Parkassistent, 360°-Kamera-System und Verkehrszeichen-Erkennung. Alle Systeme arbeiten vernetzt und lernen kontinuierlich dazu.',
        imageUrl: '/images/options/driver-assistance.png',
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Driver Assistance Package Plus',
              category: 'Safety',
              description: 'Advanced driver assistance systems for maximum safety',
              detailedDescription: 'The Driver Assistance Package Plus combines state-of-the-art safety technologies for Level 2 autonomous driving. Adaptive cruise control with stop&go function, lane keeping assist with steering correction, blind spot monitoring with evasion assistance, emergency brake assist with pedestrian detection, fatigue detection, automatic parking assistant, 360° camera system and traffic sign recognition. All systems work networked and continuously learn.'
            },
            {
              locale: 'de',
              name: 'Fahrassistenz-Paket Plus',
              category: 'Sicherheit',
              description: 'Erweiterte Fahrassistenzsysteme für maximale Sicherheit',
              detailedDescription: 'Das Fahrassistenz-Paket Plus vereint modernste Sicherheitstechnologien für autonomes Fahren Level 2. Adaptive Geschwindigkeitsregelung mit Stop&Go-Funktion, Spurhalteassistent mit Lenkkorrektur, Totwinkel-Überwachung mit Ausweichunterstützung, Notbremsassistent mit Fußgängererkennung, Müdigkeitserkennung, automatischer Parkassistent, 360°-Kamera-System und Verkehrszeichen-Erkennung. Alle Systeme arbeiten vernetzt und lernen kontinuierlich dazu.'
            }
          ]
        }
      },
    }),
    prisma.option.create({
      data: {
        name: 'Adaptive LED-Scheinwerfer',
        category: 'Sicherheit',
        price: 1800,
        description: 'Intelligente LED-Scheinwerfer mit adaptiver Lichtverteilung',
        detailedDescription: 'Die adaptiven LED-Scheinwerfer mit Matrix-Technologie revolutionieren die Nachtsicht. 84 individuell ansteuerbare LED-Module passen die Lichtverteilung in Echtzeit an Verkehrssituationen an. Automatisches Fernlicht blendet entgegenkommende Fahrzeuge gezielt aus, ohne die Umgebung zu verdunkeln. Kurvenlicht folgt dem Lenkwinkel, Autobahnlicht erhöht die Reichweite auf 600m. Regen- und Nebellicht-Modi optimieren Sicht bei schlechten Wetterbedingungen. Tagfahrlicht-Signatur mit charakteristischem Design.',
        imageUrl: '/images/options/adaptive-led.png',
        translations: {
          create: [
            {
              locale: 'en',
              name: 'Adaptive LED Headlights',
              category: 'Safety',
              description: 'Intelligent LED headlights with adaptive light distribution',
              detailedDescription: 'The adaptive LED headlights with matrix technology revolutionize night vision. 84 individually controllable LED modules adapt the light distribution in real time to traffic situations. Automatic high beam selectively dims oncoming vehicles without darkening the environment. Cornering light follows the steering angle, highway light increases range to 600m. Rain and fog light modes optimize visibility in poor weather conditions. Daytime running light signature with characteristic design.'
            },
            {
              locale: 'de',
              name: 'Adaptive LED-Scheinwerfer',
              category: 'Sicherheit',
              description: 'Intelligente LED-Scheinwerfer mit adaptiver Lichtverteilung',
              detailedDescription: 'Die adaptiven LED-Scheinwerfer mit Matrix-Technologie revolutionieren die Nachtsicht. 84 individuell ansteuerbare LED-Module passen die Lichtverteilung in Echtzeit an Verkehrssituationen an. Automatisches Fernlicht blendet entgegenkommende Fahrzeuge gezielt aus, ohne die Umgebung zu verdunkeln. Kurvenlicht folgt dem Lenkwinkel, Autobahnlicht erhöht die Reichweite auf 600m. Regen- und Nebellicht-Modi optimieren Sicht bei schlechten Wetterbedingungen. Tagfahrlicht-Signatur mit charakteristischem Design.'
            }
          ]
        }
      },
    })
  ])

  console.log('⚙️  Created options')

  // Create required groups configuration
  await prisma.requiredGroup.createMany({
    data: [
      {
        id: 'req_engine',
        exclusiveGroup: 'engine',
        isRequired: true,
        displayName: 'Motor',
        description: 'Ein Fahrzeug benötigt einen Motor'
      },
      {
        id: 'req_paint',
        exclusiveGroup: 'paint',
        isRequired: true,
        displayName: 'Lackierung',
        description: 'Ein Fahrzeug benötigt eine Lackierung'
      },
      {
        id: 'req_wheels',
        exclusiveGroup: 'wheels',
        isRequired: true,
        displayName: 'Felgen/Reifen',
        description: 'Ein Fahrzeug benötigt Felgen und Reifen'
      }
    ]
  })

  console.log('🎯 Created required groups configuration')

  // Link compatible options to cars
  const cars = [luxuryX5, eleganceSedan, prestigeCoupe]

  for (const car of cars) {
    // All cars get basic options
    const basicOptionIds = options.slice(0, 8).map(opt => opt.id)

    // SUV gets all options
    if (car.category === 'SUV') {
      for (const option of options) {
        await prisma.carOption.create({
          data: {
            carId: car.id,
            optionId: option.id
          }
        })
      }
    } else {
      // Other cars get most options except some specific ones
      for (const option of options.slice(0, 10)) {
        await prisma.carOption.create({
          data: {
            carId: car.id,
            optionId: option.id
          }
        })
      }
    }
  }

  console.log('🔗 Linked car options')

  // Create sample configurations
  const demoConfig = await prisma.configuration.create({
    data: {
      name: 'Mein Luxury X5 Premium',
      totalPrice: 75400,
      userId: demoUser.id,
      carId: luxuryX5.id,
      options: {
        create: [
          { optionId: options[0].id }, // Sportmotor
          { optionId: options[2].id }, // Metallic-Lackierung
          { optionId: options[4].id }, // 19" Sportfelgen
          { optionId: options[6].id }, // Leder-Ausstattung
          { optionId: options[7].id }, // Panorama-Schiebedach
          { optionId: options[8].id }  // Navigation Premium
        ]
      }
    }
  })

  console.log('🎯 Created sample configurations')
  console.log('✅ Seed completed successfully!')
  console.log('')
  console.log('👤 Login credentials:')
  console.log('   Admin: admin@carconfigurator.com / admin123')
  console.log('   Demo:  demo@carconfigurator.com / demo123')
  console.log('')
  console.log('🚗 Created 3 cars with comprehensive options')
  console.log('⚙️  Created 12 different options across 6 categories')
  console.log('🎯 Created required groups: engine, paint, wheels (all required)')
  console.log('🎯 Created sample configuration for demo user')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
