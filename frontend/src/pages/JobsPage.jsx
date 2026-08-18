import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header.jsx';
import Hero from '../components/Hero.jsx';
import JobListItem from '../components/JobListItem.jsx';
import JobDetailModal from '../components/JobDetailModal.jsx';
import FeaturedCompany from '../components/FeaturedCompany.jsx';
import SidebarIngestionWidget from '../components/SidebarIngestionWidget.jsx';
import IngestionModal from '../components/IngestionModal.jsx';
import SandboxModal from '../components/SandboxModal.jsx';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal.jsx';
import TermsModal from '../components/TermsModal.jsx';
import ArchitectureDocsModal from '../components/ArchitectureDocsModal.jsx';
import Footer from '../components/Footer.jsx';
import Pagination from '../components/Pagination.jsx';
import LoadingState from '../components/LoadingState.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import BottomNav from '../components/BottomNav.jsx';
import { fetchJobs, fetchSourceHealth, triggerOrchestratedRun, fetchSandboxOverrides } from '../services/api.js';

const LIMIT = 10;

export default function JobsPage() {
  const [jobs, setJobs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: LIMIT, total: 0 });
  const [filters, setFilters] = useState({ search: '', company: '', categoryLabel: 'All Job Posts' });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sourceHealth, setSourceHealth] = useState([]);
  const [sandboxActiveCount, setSandboxActiveCount] = useState(0);
  const [ingestionRunning, setIngestionRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  // Modals state
  const [selectedJob, setSelectedJob] = useState(null);
  const [ingestionModalOpen, setIngestionModalOpen] = useState(false);
  const [sandboxModalOpen, setSandboxModalOpen] = useState(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [archDocsModalOpen, setArchDocsModalOpen] = useState(false);

  const loadHealthAndOverrides = useCallback(async () => {
    try {
      const [healthRes, overridesRes] = await Promise.all([
        fetchSourceHealth(),
        fetchSandboxOverrides(),
      ]);
      setSourceHealth(healthRes.data || []);
      const overrides = overridesRes.activeOverrides || {};
      setSandboxActiveCount(Object.keys(overrides).length);
    } catch {
      // Ignored
    }
  }, []);

  useEffect(() => {
    loadHealthAndOverrides();
  }, [loadHealthAndOverrides]);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJobs({
        page,
        limit: LIMIT,
        search: filters.search,
        company: filters.company,
      });
      setJobs(result.data || []);
      setPagination(result.pagination || { page: 1, limit: LIMIT, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function handleSearchSubmit(query) {
    setFilters((prev) => ({
      ...prev,
      search: query,
      categoryLabel: query ? `Search: "${query}"` : 'All Job Posts',
    }));
    setPage(1);
  }

  function handleCategorySelect(value, label) {
    setFilters((prev) => ({
      ...prev,
      search: value,
      categoryLabel: label ? `All ${label}` : 'All Job Posts',
    }));
    setPage(1);
  }

  function handleCompanySelect(companyName) {
    setFilters((prev) => ({
      ...prev,
      company: companyName,
      categoryLabel: companyName ? `Jobs at ${companyName}` : 'All Job Posts',
    }));
    setPage(1);
  }

  function handleResetFilters() {
    setFilters({ search: '', company: '', categoryLabel: 'All Job Posts' });
    setPage(1);
  }

  function handlePageChange(newPage) {
    setPage(newPage);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  }

  async function handleQuickIngestionRun() {
    setIngestionRunning(true);
    try {
      await triggerOrchestratedRun();
      await loadHealthAndOverrides();
      setPage(1);
      await loadJobs();
    } catch (err) {
      alert(`Ingestion run error: ${err.message}`);
    } finally {
      setIngestionRunning(false);
    }
  }

  function handleTabChange(tabId) {
    setActiveTab(tabId);
    if (tabId === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (tabId === 'sources') {
      const widgetEl = document.getElementById('sidebar-ingestion-widget');
      if (widgetEl) {
        widgetEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 500, behavior: 'smooth' });
      }
    } else if (tabId === 'sandbox') {
      setSandboxModalOpen(true);
    } else if (tabId === 'settings') {
      setArchDocsModalOpen(true);
    }
  }

  const hasActiveFilters = filters.search || filters.company;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between w-full overflow-x-hidden">
      <div className="w-full min-w-0 pb-16 sm:pb-0">
        {/* Header Navigation */}
        <Header
          onSearch={handleSearchSubmit}
          onCategorySelect={handleCategorySelect}
          onOpenIngestionModal={() => setIngestionModalOpen(true)}
          onOpenSandboxModal={() => setSandboxModalOpen(true)}
          onResetFilters={handleResetFilters}
          sandboxActiveCount={sandboxActiveCount}
        />

        {/* Hero Banner */}
        <Hero onPrimaryCTA={() => setIngestionModalOpen(true)} />

        {/* Active Sandbox Indicator Banner */}
        {sandboxActiveCount > 0 && (
          <div className="bg-amber-950 text-amber-200 border-y border-amber-800 py-2.5 px-3 text-center text-xs font-semibold flex items-center justify-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
            <span>DEMO SANDBOX ACTIVE: {sandboxActiveCount} simulated failure override{sandboxActiveCount > 1 ? 's' : ''} set.</span>
            <button
              onClick={() => setSandboxModalOpen(true)}
              className="underline font-bold hover:text-white transition ml-1"
            >
              Open Sandbox Console
            </button>
          </div>
        )}

        {/* Main Body Section */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 pb-16 sm:pb-20 w-full min-w-0">
          <div className="grid lg:grid-cols-12 gap-6 sm:gap-8 items-start w-full min-w-0">
            {/* Left Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Search Bar Input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleSearchSubmit(e.target.value)}
                  placeholder="Search jobs by title, company, or keyword..."
                  className="w-full bg-white border border-gray-200/90 rounded-2xl pl-12 pr-10 py-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-400 focus:ring-1 focus:ring-gray-400 shadow-sm transition"
                />
                {filters.search && (
                  <button
                    onClick={() => handleSearchSubmit('')}
                    className="absolute inset-y-0 right-4 flex items-center text-xs text-gray-400 hover:text-gray-900 font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Section Heading */}
              <div className="flex items-center justify-between pt-2">
                <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  {filters.categoryLabel}
                </h2>
                <span className="text-xs font-semibold text-gray-500 shrink-0 whitespace-nowrap">
                  {pagination.total.toLocaleString()} job{pagination.total === 1 ? '' : 's'} available
                </span>
              </div>

              {/* Jobs List */}
              {loading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} onRetry={loadJobs} />
              ) : jobs.length === 0 ? (
                <EmptyState
                  hasFilters={hasActiveFilters}
                  onClear={handleResetFilters}
                />
              ) : (
                <div className="space-y-3.5">
                  {jobs.map((job) => (
                    <JobListItem
                      key={job.id}
                      job={job}
                      onClick={() => setSelectedJob(job)}
                    />
                  ))}

                  {/* Pagination */}
                  <div className="pt-6">
                    <Pagination
                      page={pagination.page}
                      limit={pagination.limit}
                      total={pagination.total}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div id="sidebar-ingestion-widget" className="lg:col-span-4 space-y-6">
              <SidebarIngestionWidget
                onRunIngestion={handleQuickIngestionRun}
                onOpenSandbox={() => setSandboxModalOpen(true)}
                sourceHealth={sourceHealth}
                running={ingestionRunning}
                onRefreshHealth={loadHealthAndOverrides}
              />

              <FeaturedCompany
                selectedCompany={filters.company}
                onSelectCompany={handleCompanySelect}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Footer */}
      <Footer
        onCategoryClick={handleCategorySelect}
        onOpenPrivacy={() => setPrivacyModalOpen(true)}
        onOpenTerms={() => setTermsModalOpen(true)}
        onOpenArchitectureDocs={() => setArchDocsModalOpen(true)}
      />

      {/* Modals */}
      {selectedJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {ingestionModalOpen && (
        <IngestionModal
          onClose={() => setIngestionModalOpen(false)}
          onIngestionSuccess={() => {
            loadHealthAndOverrides();
            loadJobs();
          }}
        />
      )}

      {sandboxModalOpen && (
        <SandboxModal
          onClose={() => setSandboxModalOpen(false)}
          onOverrideChange={loadHealthAndOverrides}
          sourceHealth={sourceHealth}
          onRunIngestion={() => setIngestionModalOpen(true)}
        />
      )}

      <PrivacyPolicyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />

      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />

      <ArchitectureDocsModal
        isOpen={archDocsModalOpen}
        onClose={() => setArchDocsModalOpen(false)}
      />
    </div>
  );
}
