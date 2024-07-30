  <AnimatePresence>
        {showRewardCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"
            onClick={() => setShowRewardCard(false)} // Click anywhere to close RewardCard
          >
            <RewardCard onClose={() => setShowRewardCard(false)} user={homeData} />
          </motion.div>
        )}
      </AnimatePresence>