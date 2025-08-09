'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Music,
  MapPin,
  Star,
  Clock,
  CheckCircle,
  Globe,
  Instagram,
  Youtube,
  Play,
  Calendar,
  Mail,
  Phone,
  Award,
  Headphones,
  Share2,
  Download,
  Quote,
  Disc,
  Radio,
  ArrowLeft,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { getDJProfileBySlug } from '@/lib/services/dj-service';
import { DJProfile } from '@/lib/types/dj-profile';

export default function DJEPKPage() {
  const params = useParams();
  const router = useRouter();
  const [dj, setDJ] = useState<DJProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      loadDJProfile(params.slug as string);
    }
  }, [params.slug]);

  const loadDJProfile = async (slug: string) => {
    try {
      setLoading(true);
      const profile = await getDJProfileBySlug(slug);
      if (profile) {
        setDJ(profile);
      } else {
        router.push('/djs');
      }
    } catch (error) {
      console.error('Error loading DJ profile:', error);
      router.push('/djs');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadEPK = () => {
    // TODO: Generate PDF version of EPK
    alert('EPK download feature coming soon!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${dj?.artistName} - Electronic Press Kit`,
        text: `Check out ${dj?.artistName}'s EPK`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('EPK link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Loading EPK...</p>
        </div>
      </div>
    );
  }

  if (!dj) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-black bg-opacity-90 backdrop-blur-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/djs/${dj.slug}`)}
            className="text-white hover:text-gray-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Profile
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="border-white text-white hover:bg-white hover:text-black"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadEPK}
              className="border-white text-white hover:bg-white hover:text-black"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center">
        {dj.media?.coverPhoto ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${dj.media.coverPhoto})` }}
          >
            <div className="absolute inset-0 bg-black bg-opacity-60"></div>
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900"></div>
        )}
        
        <div className="relative z-10 text-center px-4">
          {dj.media?.logo && (
            <img
              src={dj.media.logo}
              alt={dj.artistName}
              className="h-24 mx-auto mb-8"
            />
          )}
          
          <h1 className="text-6xl md:text-8xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
            {dj.artistName}
          </h1>
          
          <div className="flex items-center justify-center gap-4 mb-6 text-lg">
            {dj.currentCity && (
              <span className="flex items-center gap-1">
                <MapPin className="h-5 w-5" />
                {dj.currentCity}
              </span>
            )}
            {dj.yearsActive && (
              <span className="flex items-center gap-1">
                <Clock className="h-5 w-5" />
                {dj.yearsActive} years active
              </span>
            )}
            {dj.isVerified && (
              <span className="flex items-center gap-1">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Verified
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {dj.genres.map((genre) => (
              <Badge
                key={genre}
                variant="outline"
                className="border-white text-white text-lg px-4 py-1"
              >
                {genre}
              </Badge>
            ))}
          </div>
          
          {dj.shortBio && (
            <p className="text-xl max-w-3xl mx-auto mb-8 text-gray-300">
              {dj.shortBio}
            </p>
          )}
          
          {/* Social Links */}
          {dj.social && Object.keys(dj.social).length > 0 && (
            <div className="flex justify-center gap-4">
              {dj.social.instagram && (
                <a
                  href={`https://instagram.com/${dj.social.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-white rounded-full hover:bg-white hover:text-black transition-colors"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              {dj.social.soundcloud && (
                <a
                  href={`https://soundcloud.com/${dj.social.soundcloud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-white rounded-full hover:bg-white hover:text-black transition-colors"
                >
                  <Radio className="h-6 w-6" />
                </a>
              )}
              {dj.social.youtube && (
                <a
                  href={`https://youtube.com/@${dj.social.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-white rounded-full hover:bg-white hover:text-black transition-colors"
                >
                  <Youtube className="h-6 w-6" />
                </a>
              )}
              {dj.social.spotify && (
                <a
                  href={dj.social.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-white rounded-full hover:bg-white hover:text-black transition-colors"
                >
                  <Disc className="h-6 w-6" />
                </a>
              )}
              {dj.social.website && (
                <a
                  href={dj.social.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-white rounded-full hover:bg-white hover:text-black transition-colors"
                >
                  <Globe className="h-6 w-6" />
                </a>
              )}
            </div>
          )}
        </div>
        
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Biography */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-4xl font-bold mb-8 text-center">Biography</h2>
          <p className="text-lg leading-relaxed text-gray-300 whitespace-pre-wrap">
            {dj.bio}
          </p>
        </div>
      </section>

      {/* Stats */}
      {dj.stats && (
        <section className="py-20 px-4 bg-gray-900">
          <div className="container mx-auto max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {dj.stats.totalGigs && (
                <div>
                  <p className="text-5xl font-bold text-purple-400">{dj.stats.totalGigs}</p>
                  <p className="text-gray-400 mt-2">Shows Played</p>
                </div>
              )}
              {dj.stats.totalVenues && (
                <div>
                  <p className="text-5xl font-bold text-pink-400">{dj.stats.totalVenues}</p>
                  <p className="text-gray-400 mt-2">Venues</p>
                </div>
              )}
              {dj.yearsActive && (
                <div>
                  <p className="text-5xl font-bold text-blue-400">{dj.yearsActive}</p>
                  <p className="text-gray-400 mt-2">Years Active</p>
                </div>
              )}
              {dj.stats.averageRating && (
                <div>
                  <p className="text-5xl font-bold text-yellow-400 flex items-center justify-center">
                    {dj.stats.averageRating.toFixed(1)}
                    <Star className="h-8 w-8 ml-2" />
                  </p>
                  <p className="text-gray-400 mt-2">Average Rating</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Press Quotes */}
      {dj.press?.quotes && dj.press.quotes.filter(q => q.featured).length > 0 && (
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl font-bold mb-12 text-center">Press</h2>
            <div className="space-y-12">
              {dj.press.quotes.filter(q => q.featured).map((quote) => (
                <div key={quote.id} className="text-center">
                  <Quote className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-2xl italic mb-4">"{quote.quote}"</p>
                  <p className="text-gray-400">
                    — {quote.source}
                    {quote.date && `, ${format(quote.date.toDate(), 'MMM yyyy')}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Mixes */}
      {dj.media?.mixLinks && dj.media.mixLinks.filter(m => m.featured).length > 0 && (
        <section className="py-20 px-4 bg-gray-900">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-4xl font-bold mb-12 text-center">Featured Mixes</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dj.media.mixLinks.filter(m => m.featured).map((mix) => (
                <a
                  key={mix.id}
                  href={mix.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-black border border-gray-800 rounded-lg p-6 hover:border-purple-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Headphones className="h-8 w-8 text-purple-400" />
                    <ExternalLink className="h-5 w-5 text-gray-500 group-hover:text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{mix.title}</h3>
                  {mix.genre && (
                    <p className="text-gray-400 mb-2">{mix.genre}</p>
                  )}
                  {mix.duration && (
                    <p className="text-gray-500 text-sm">{mix.duration} minutes</p>
                  )}
                  {(mix.plays || mix.likes) && (
                    <div className="flex gap-4 mt-3 text-sm text-gray-500">
                      {mix.plays && <span>{mix.plays.toLocaleString()} plays</span>}
                      {mix.likes && <span>{mix.likes.toLocaleString()} likes</span>}
                    </div>
                  )}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Achievements */}
      {dj.press?.achievements && dj.press.achievements.length > 0 && (
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <h2 className="text-4xl font-bold mb-12 text-center">Achievements</h2>
            <div className="grid md:grid-cols-2 gap-8">
              {dj.press.achievements.map((achievement) => (
                <div key={achievement.id} className="flex gap-4">
                  <Award className="h-12 w-12 text-yellow-500 flex-shrink-0" />
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{achievement.title}</h3>
                    {achievement.description && (
                      <p className="text-gray-400">{achievement.description}</p>
                    )}
                    {achievement.year && (
                      <p className="text-gray-500 text-sm mt-2">{achievement.year}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Residencies */}
      {dj.press?.residencies && dj.press.residencies.filter(r => r.active).length > 0 && (
        <section className="py-20 px-4 bg-gray-900">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-4xl font-bold mb-12 text-center">Current Residencies</h2>
            <div className="space-y-4">
              {dj.press.residencies.filter(r => r.active).map((residency) => (
                <div
                  key={residency.id}
                  className="flex items-center justify-between p-6 bg-black border border-gray-800 rounded-lg"
                >
                  <div>
                    <h3 className="text-xl font-semibold">{residency.venueName}</h3>
                    {residency.frequency && (
                      <p className="text-gray-400">{residency.frequency}</p>
                    )}
                    {residency.dayOfWeek && (
                      <p className="text-gray-500 text-sm capitalize">{residency.dayOfWeek}s</p>
                    )}
                  </div>
                  <Badge className="bg-green-500 text-white">Active</Badge>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="py-20 px-4 bg-gradient-to-r from-purple-900 to-pink-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-8">Get In Touch</h2>
          
          {dj.settings.acceptsDirectBookings && (
            <Button
              size="lg"
              onClick={() => router.push(`/djs/${dj.slug}?booking=true`)}
              className="mb-8"
            >
              <Calendar className="h-5 w-5 mr-2" />
              Book {dj.artistName}
            </Button>
          )}
          
          <div className="flex justify-center gap-8">
            {dj.settings.bookingEmail && (
              <a
                href={`mailto:${dj.settings.bookingEmail}`}
                className="flex items-center gap-2 hover:text-purple-300 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span>Booking Inquiries</span>
              </a>
            )}
            {dj.settings.managementEmail && (
              <a
                href={`mailto:${dj.settings.managementEmail}`}
                className="flex items-center gap-2 hover:text-purple-300 transition-colors"
              >
                <Mail className="h-5 w-5" />
                <span>Management</span>
              </a>
            )}
            {dj.phone && (
              <a
                href={`tel:${dj.phone}`}
                className="flex items-center gap-2 hover:text-purple-300 transition-colors"
              >
                <Phone className="h-5 w-5" />
                <span>{dj.phone}</span>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-black border-t border-gray-800">
        <div className="container mx-auto text-center text-gray-500">
          <p>© {new Date().getFullYear()} {dj.artistName}. All rights reserved.</p>
          <p className="mt-2 text-sm">
            Electronic Press Kit powered by Gigguin
          </p>
        </div>
      </footer>
    </div>
  );
}