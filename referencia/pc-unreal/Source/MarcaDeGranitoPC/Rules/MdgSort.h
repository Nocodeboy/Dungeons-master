// Marca de Granito · núcleo de reglas portable.
// Ordenación idéntica a Array.sort_custom de Godot (SortArray: introsort + inserción final).
// No es estable con más de 16 elementos: para que la IA elija lo mismo que en Godot cuando hay
// empates, hay que ordenar exactamente igual.
#pragma once

#include <cstdint>
#include <utility>
#include <vector>

namespace mdg
{

namespace sort_detail
{

template <class T, class Less>
class GodotSortArray
{
public:
	explicit GodotSortArray(Less& less) : compare(less) {}

	static constexpr int64_t kIntrosortThreshold = 16;
	Less& compare;

	const T& median_of_3(const T& a, const T& b, const T& c) const
	{
		if (compare(a, b))
		{
			if (compare(b, c))
			{
				return b;
			}
			if (compare(a, c))
			{
				return c;
			}
			return a;
		}
		if (compare(a, c))
		{
			return a;
		}
		if (compare(b, c))
		{
			return c;
		}
		return b;
	}

	static int64_t bitlog(int64_t n)
	{
		int64_t k = 0;
		for (; n != 1; n >>= 1)
		{
			++k;
		}
		return k;
	}

	void push_heap(int64_t first, int64_t hole_idx, int64_t top_index, T value, T* a) const
	{
		int64_t parent = (hole_idx - 1) / 2;
		while (hole_idx > top_index && compare(a[first + parent], value))
		{
			a[first + hole_idx] = a[first + parent];
			hole_idx = parent;
			parent = (hole_idx - 1) / 2;
		}
		a[first + hole_idx] = value;
	}

	void adjust_heap(int64_t first, int64_t hole_idx, int64_t len, T value, T* a) const
	{
		const int64_t top_index = hole_idx;
		int64_t second_child = 2 * hole_idx + 2;
		while (second_child < len)
		{
			if (compare(a[first + second_child], a[first + (second_child - 1)]))
			{
				second_child--;
			}
			a[first + hole_idx] = a[first + second_child];
			hole_idx = second_child;
			second_child = 2 * (second_child + 1);
		}
		if (second_child == len)
		{
			a[first + hole_idx] = a[first + (second_child - 1)];
			hole_idx = second_child - 1;
		}
		push_heap(first, hole_idx, top_index, value, a);
	}

	void pop_heap(int64_t first, int64_t last, int64_t result, T value, T* a) const
	{
		a[result] = a[first];
		adjust_heap(first, 0, last - first, value, a);
	}

	void pop_heap(int64_t first, int64_t last, T* a) const
	{
		pop_heap(first, last - 1, last - 1, a[last - 1], a);
	}

	void make_heap(int64_t first, int64_t last, T* a) const
	{
		if (last - first < 2)
		{
			return;
		}
		const int64_t len = last - first;
		int64_t parent = (len - 2) / 2;
		while (true)
		{
			adjust_heap(first, parent, len, a[first + parent], a);
			if (parent == 0)
			{
				return;
			}
			parent--;
		}
	}

	void sort_heap(int64_t first, int64_t last, T* a) const
	{
		while (last - first > 1)
		{
			pop_heap(first, last--, a);
		}
	}

	void partial_sort(int64_t first, int64_t last, int64_t middle, T* a) const
	{
		make_heap(first, middle, a);
		for (int64_t i = middle; i < last; i++)
		{
			if (compare(a[i], a[first]))
			{
				pop_heap(first, middle, i, a[i], a);
			}
		}
		sort_heap(first, middle, a);
	}

	int64_t partitioner(int64_t first, int64_t last, T pivot, T* a) const
	{
		const int64_t unmodified_first = first;
		const int64_t unmodified_last = last;
		while (true)
		{
			while (compare(a[first], pivot))
			{
				if (first == unmodified_last - 1)
				{
					break; // comparación inválida: Godot avisa y sigue
				}
				first++;
			}
			last--;
			while (compare(pivot, a[last]))
			{
				if (last == unmodified_first)
				{
					break;
				}
				last--;
			}
			if (!(first < last))
			{
				return first;
			}
			std::swap(a[first], a[last]);
			first++;
		}
	}

	void introsort(int64_t first, int64_t last, T* a, int64_t max_depth) const
	{
		while (last - first > kIntrosortThreshold)
		{
			if (max_depth == 0)
			{
				partial_sort(first, last, last, a);
				return;
			}
			max_depth--;
			const int64_t cut = partitioner(first, last, median_of_3(a[first], a[first + (last - first) / 2], a[last - 1]), a);
			introsort(cut, last, a, max_depth);
			last = cut;
		}
	}

	void unguarded_linear_insert(int64_t last, T value, T* a) const
	{
		int64_t next = last - 1;
		while (compare(value, a[next]))
		{
			if (next == 0)
			{
				break;
			}
			a[last] = a[next];
			last = next;
			next--;
		}
		a[last] = value;
	}

	void linear_insert(int64_t first, int64_t last, T* a) const
	{
		T val = a[last];
		if (compare(val, a[first]))
		{
			for (int64_t i = last; i > first; i--)
			{
				a[i] = a[i - 1];
			}
			a[first] = val;
		}
		else
		{
			unguarded_linear_insert(last, val, a);
		}
	}

	void insertion_sort(int64_t first, int64_t last, T* a) const
	{
		if (first == last)
		{
			return;
		}
		for (int64_t i = first + 1; i != last; i++)
		{
			linear_insert(first, i, a);
		}
	}

	void unguarded_insertion_sort(int64_t first, int64_t last, T* a) const
	{
		for (int64_t i = first; i != last; i++)
		{
			unguarded_linear_insert(i, a[i], a);
		}
	}

	void final_insertion_sort(int64_t first, int64_t last, T* a) const
	{
		if (last - first > kIntrosortThreshold)
		{
			insertion_sort(first, first + kIntrosortThreshold, a);
			unguarded_insertion_sort(first + kIntrosortThreshold, last, a);
		}
		else
		{
			insertion_sort(first, last, a);
		}
	}

	void sort(T* a, int64_t len) const
	{
		if (len > 0)
		{
			introsort(0, len, a, bitlog(len) * 2);
			final_insertion_sort(0, len, a);
		}
	}
};

} // namespace sort_detail

/** Array.sort_custom(less) de Godot, con el mismo algoritmo. */
template <class T, class Less>
void godot_sort(std::vector<T>& v, Less less)
{
	sort_detail::GodotSortArray<T, Less> s(less);
	s.sort(v.data(), static_cast<int64_t>(v.size()));
}

} // namespace mdg
