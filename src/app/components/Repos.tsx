/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import axios from "axios";
import React, { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import RepoCard from "./RepoCard";

interface Repository {
  id: number;
  name: string;
  html_url: string;
  language: string;
  stargazers_count: number;
}

export default function Repos() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [displayedRepoIds, setDisplayedRepoIds] = useState<Set<number>>(
    new Set()
  );

  useEffect(() => {
    const loadMoreRepositories = async () => {
      try {
        setLoading(true);

        const response = await axios.get<Repository[]>(
          `https://api.github.com/users/felipegomss/repos?page=${page}&per_page=12&sort=updated`
        );
        const newRepositories = response.data.filter(
          (repo) => !displayedRepoIds.has(repo.id)
        );

        setRepositories((prevRepositories) => [
          ...prevRepositories,
          ...newRepositories,
        ]);

        setLoading(false);

        const newRepoIds = newRepositories.map(
          (repo: { id: number }) => repo.id
        );
        setDisplayedRepoIds(
          (prevIds) => new Set([...Array.from(prevIds), ...newRepoIds])
        );
      } catch (error) {
        console.error("Erro ao carregar os repositórios:", error);
        setLoading(false);
      }
    };

    loadMoreRepositories();
  }, [page]);

  const handleLoadMore = () => {
    setPage((prevPage) => prevPage + 1);
  };

  return (
    <div className="p-8 m-auto max-w-7xl md:px-0">
      <h1 className="my-8 text-5xl font-extrabold">Code Expedition</h1>
      <ul className="grid gap-8 md:grid-cols-4">
        {repositories.map((repo) => (
          <li key={repo.id}>
            <RepoCard
              language={repo.language}
              name={repo.name}
              stars={repo.stargazers_count}
              url={repo.html_url}
            />
          </li>
        ))}
      </ul>
      <div className="m-auto my-10 md:w-1/3">
        <button
          className="relative flex items-center justify-center w-full gap-4 px-8 py-4 my-10 cursor-pointer group rounded-2xl"
          onClick={handleLoadMore}
          disabled={loading}
        >
          {loading ? (
            <Loader size={32} className="ease-out animate-spin" />
          ) : (
            <h2 className="text-xl font-extrabold ease-in-out border-b hover:scale-105 md:text-lg">
              Mostrar mais
            </h2>
          )}
        </button>
      </div>
    </div>
  );
}
